import threading
import base64
import requests
import webview
import json
import uuid
from pathlib import Path
from config.config_manager import ConfigManager
from utils.helpers import get_app_dir, get_bundle_dir, get_ffmpeg_path, get_ytdlp_path
from clipper_core import AutoClipperCore
import logging
import os
import shutil
import re

# Configure logging
def setup_logging():
    app_dir = get_app_dir()
    log_file = app_dir / "app.log"
    
    # Create logger
    logger = logging.getLogger("YTShortClipper")
    logger.setLevel(logging.INFO)
    
    # clear existing handlers to avoid duplicates
    if logger.handlers:
        logger.handlers.clear()
        
    # File handler
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(file_handler)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter('%(levelname)s: %(message)s'))
    logger.addHandler(console_handler)
    
    return logger

logger = None


class WebAPI:
    def __init__(self):
        global logger
        if logger is None:
            logger = setup_logging()
        
        logger.info("Initializing WebAPI...")
        app_dir = get_app_dir()
        self.config_file = str(app_dir / "config.json")
        self.output_dir = str(app_dir / "output")
        self.downloads_dir = str(app_dir / "downloads")
        self.downloads_db_file = str(app_dir / "downloads.json")
        self.status = "idle"
        self.progress = 0.0
        self.thread = None
        
        # Download-specific state
        self.download_status = "idle"
        self.download_progress = 0.0
        self.download_thread = None
        
        # Clipping-specific state
        self.clipping_status = "idle"
        self.clipping_progress = 0.0
        self.clipping_thread = None
        
        # Create downloads directory if it doesn't exist
        Path(self.downloads_dir).mkdir(parents=True, exist_ok=True)
        
        # Initialize downloads database
        self._init_downloads_db()
        
        # Cookies file path
        self.cookies_file = str(get_app_dir() / "cookies.txt")

    def upload_cookies(self, content):
        """Upload cookies.txt file"""
        logger.info("Action: upload_cookies")
        try:
            with open(self.cookies_file, 'w', encoding='utf-8') as f:
                f.write(content)
            logger.info("Cookies uploaded successfully")
            return {"status": "success", "message": "Cookies uploaded successfully"}
        except Exception as e:
            logger.error(f"Failed to upload cookies: {str(e)}", exc_info=True)
            return {"status": "error", "message": f"Failed to upload cookies: {str(e)}"}
    
    def check_cookies(self):
        """Check if cookies.txt exists"""
        logger.info("Action: check_cookies")
        cookies_path = Path(self.cookies_file)
        exists = cookies_path.exists()
        logger.info(f"Cookies check: {exists} at {cookies_path}")
        return {"exists": exists, "path": str(cookies_path)}
    
    def _init_downloads_db(self):
        """Initialize downloads database file and sync with filesystem"""
        db_path = Path(self.downloads_dir) / "downloads.json"
        
        # Create database if doesn't exist
        if not db_path.exists():
            with open(db_path, 'w', encoding='utf-8') as f:
                json.dump({"videos": []}, f, indent=2)
        
        # Sync filesystem with database (restore missing entries)
        self._sync_downloads_from_filesystem()
    
    def _sync_downloads_from_filesystem(self):
        """Sync filesystem videos with database (restore from files if database lost)"""
        logger.info("Action: _sync_downloads_from_filesystem")
        try:
            import yt_dlp
            
            db = self._read_downloads_db()
            videos = db.get("videos", [])
            existing_ids = {v["id"] for v in videos}
            
            # Scan downloads folder for .mp4 files
            downloads_path = Path(self.downloads_dir)
            for mp4_file in downloads_path.glob("*.mp4"):
                video_id = mp4_file.stem  # YouTube ID from filename
                
                # Skip if already in database
                if video_id in existing_ids:
                    continue
                
                # Skip temp folder
                if mp4_file.parent.name == "_temp":
                    continue
                
                # File exists but not in database - try to restore
                try:
                    # Try to get video info from YouTube
                    url = f"https://www.youtube.com/watch?v={video_id}"
                    
                    ydl_opts = {'quiet': True, 'no_warnings': True}
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        info = ydl.extract_info(url, download=False)
                        title = info.get('title', f'Video {video_id}')
                except:
                    # If can't get info, use filename as title
                    title = f'Video {video_id}'
                
                # Check for subtitle
                srt_file = downloads_path / f"{video_id}.srt"
                subtitle_path = str(srt_file) if srt_file.exists() else None
                
                # Add to database
                videos.append({
                    "id": video_id,
                    "url": url,
                    "title": title,
                    "path": str(mp4_file),
                    "subtitle_path": subtitle_path,
                })
                
                logger.info(f"[DB Sync] Restored: {video_id} - {title}")
            
            # Save updated database
            if len(videos) > len(existing_ids):
                db["videos"] = videos
                self._write_downloads_db(db)
                logger.info(f"[DB Sync] Restored {len(videos) - len(existing_ids)} videos from filesystem")
        
        except Exception as e:
            logger.error(f"Error syncing downloads from filesystem: {e}", exc_info=True)
    
    def _read_downloads_db(self):
        """Read downloads database"""
        db_path = Path(self.downloads_dir) / "downloads.json"
        try:
            if db_path.exists():
                with open(db_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                return {"videos": []}
        except Exception as e:
            logger.error(f"Error reading downloads database: {e}")
            return {"videos": []}
    
    def _write_downloads_db(self, data):
        """Write downloads database"""
        db_path = Path(self.downloads_dir) / "downloads.json"
        try:
            with open(db_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error writing downloads database: {e}")

    def get_progress(self):
        return {"status": self.status, "progress": self.progress}

    def get_asset_paths(self):
        logger.info("Action: get_asset_paths")
        bundle_dir = get_bundle_dir()
        icon_path = Path(bundle_dir) / "assets" / "icon.png"
        return {"icon": str(icon_path)}

    def get_icon_data(self):
        logger.info("Action: get_icon_data")
        try:
            bundle_dir = get_bundle_dir()
            icon_path = Path(bundle_dir) / "assets" / "icon.png"
            if not icon_path.exists():
                return {"data": ""}
            raw = icon_path.read_bytes()
            encoded = base64.b64encode(raw).decode("utf-8")
            return {"data": f"data:image/png;base64,{encoded}"}
        except:
            return {"data": ""}

    def get_ai_settings(self):
        logger.info("Action: get_ai_settings")
        cfg = self._get_cfg()
        return cfg.get("ai_providers", {})

    def get_provider_type(self):
        logger.info("Action: get_provider_type")
        cfg = self._get_cfg()
        return {"provider_type": cfg.get("provider_type", "ytclip")}

    def validate_api_key(self, base_url, api_key):
        logger.info(f"Action: validate_api_key url={base_url}")
        if not base_url:
            return {"status": "error", "message": "Missing base URL"}
        if not api_key:
            return {"status": "error", "message": "Missing API key"}
        url = self._get_models_url(base_url)
        try:
            resp = requests.get(url, headers=self._auth_headers(api_key), timeout=10)
            if resp.status_code == 200:
                return {"status": "ok"}
            return {"status": "error", "message": f"HTTP {resp.status_code}"}
            return {"status": "error", "message": f"HTTP {resp.status_code}"}
        except Exception as e:
            logger.error(f"validate_api_key failed: {e}")
            return {"status": "error", "message": str(e)}

    def get_models(self, base_url, api_key):
        logger.info(f"Action: get_models url={base_url}")
        if not base_url:
            return {"models": []}
        url = self._get_models_url(base_url)
        try:
            resp = requests.get(url, headers=self._auth_headers(api_key), timeout=15)
            if resp.status_code != 200:
                return {"models": []}
            data = resp.json()
            items = data.get("data", [])
            models = []
            for item in items:
                mid = item.get("id")
                if mid:
                    models.append(mid)
            return {"models": models}
        except Exception as e:
            logger.error(f"get_models failed: {e}")
            return {"models": []}

    def save_ai_settings(self, settings):
        logger.info("Action: save_ai_settings")
        if not isinstance(settings, dict):
            return {"status": "error"}
        cfg_mgr = self._get_cfg_manager()
        cfg_mgr.config["ai_providers"] = settings
        provider_type = settings.get("_provider_type")
        if provider_type:
            cfg_mgr.config["provider_type"] = provider_type
        highlight_finder = settings.get("highlight_finder", {})
        cfg_mgr.config["api_key"] = highlight_finder.get("api_key", "")
        cfg_mgr.config["base_url"] = highlight_finder.get("base_url", "https://api.openai.com/v1")
        cfg_mgr.config["model"] = highlight_finder.get("model", "gpt-4.1")
        cfg_mgr.save()
        return {"status": "saved"}

    def start_processing(self, url, num_clips=5, add_captions=True, add_hook=False, subtitle_lang="id", manual_highlights=None):
        """
        Start processing with optional manual highlights
        
        Args:
            url: YouTube video URL
            num_clips: Number of clips (ignored if manual_highlights provided)
            add_captions: Whether to add captions
            add_hook: Whether to add hook intro
            subtitle_lang: Subtitle language
            manual_highlights: Optional JSON string or list of highlight dicts for manual mode
        """
        logger.info(f"Action: start_processing url={url} mode={'manual' if manual_highlights else 'ai'}")
        
        if self.thread and self.thread.is_alive():
            return {"status": "busy"}
        
        # Parse manual_highlights if provided
        parsed_highlights = None
        if manual_highlights:
            import json
            try:
                if isinstance(manual_highlights, str):
                    parsed_highlights = json.loads(manual_highlights)
                elif isinstance(manual_highlights, list):
                    parsed_highlights = manual_highlights
                else:
                    return {"status": "error", "message": "Invalid manual highlights format"}
                
                if not isinstance(parsed_highlights, list):
                    return {"status": "error", "message": "Manual highlights must be an array"}
                
                if len(parsed_highlights) == 0:
                    return {"status": "error", "message": "Manual highlights array is empty"}
                    
            except json.JSONDecodeError as e:
                return {"status": "error", "message": f"Invalid JSON: {e}"}
        
        self.thread = threading.Thread(
            target=self._run,
            args=(url, int(num_clips), bool(add_captions), bool(add_hook), subtitle_lang, parsed_highlights),
            daemon=True,
        )
        self.thread.start()
        return {"status": "started", "mode": "manual" if parsed_highlights else "ai", "highlights_count": len(parsed_highlights) if parsed_highlights else num_clips}

    def _run(self, url, num_clips, add_captions, add_hook, subtitle_lang, manual_highlights=None):
        def log_cb(msg):
            self.status = str(msg)
            logger.info(f"[Processing] {msg}")

        def progress_cb(p):
            try:
                self.progress = float(p)
            except:
                self.progress = 0.0

        cfg = self._get_cfg()
        system_prompt = cfg.get("system_prompt", None)
        temperature = cfg.get("temperature", 1.0)
        tts_model = cfg.get("tts_model", "tts-1")
        watermark_settings = cfg.get("watermark", {"enabled": False})
        credit_watermark_settings = cfg.get("credit_watermark", {"enabled": False})
        face_tracking_mode = cfg.get("face_tracking_mode", "mediapipe")
        mediapipe_settings = cfg.get("mediapipe_settings", {
            "lip_activity_threshold": 0.15,
            "switch_threshold": 0.3,
            "min_shot_duration": 90,
            "center_weight": 0.3
        })
        output_dir = cfg.get("output_dir", str(get_app_dir() / "output"))
        model = cfg.get("model", "gpt-4.1")
        ai_providers = cfg.get("ai_providers")

        core = AutoClipperCore(
            client=None,
            ffmpeg_path=get_ffmpeg_path(),
            ytdlp_path=get_ytdlp_path(),
            output_dir=output_dir,
            model=model,
            tts_model=tts_model,
            temperature=temperature,
            system_prompt=system_prompt,
            watermark_settings=watermark_settings,
            credit_watermark_settings=credit_watermark_settings,
            face_tracking_mode=face_tracking_mode,
            mediapipe_settings=mediapipe_settings,
            ai_providers=ai_providers,
            subtitle_language=subtitle_lang,
            log_callback=log_cb,
            progress_callback=lambda s, p=None: progress_cb(p if p is not None else 0.0),
        )
        try:
            self.status = "running"
            self.progress = 0.0
            core.process(url, num_clips=num_clips, add_captions=add_captions, add_hook=add_hook, manual_highlights=manual_highlights)
            self.status = "complete"
            self.progress = 1.0
            logger.info("Processing completed successfully")
        except Exception as e:
            logger.error(f"Processing failed: {e}", exc_info=True)
            self.status = f"error: {e}"
        finally:
            self.thread = None

    def _get_cfg_manager(self):
        return ConfigManager(Path(self.config_file), Path(self.output_dir))

    def _get_cfg(self):
        cfg_mgr = self._get_cfg_manager()
        return cfg_mgr.get_all() if hasattr(cfg_mgr, "get_all") else cfg_mgr.config

    def _get_models_url(self, base_url):
        url = base_url.rstrip("/")
        if url.endswith("/v1"):
            return f"{url}/models"
        return f"{url}/v1/models"

    def _auth_headers(self, api_key):
        return {"Authorization": f"Bearer {api_key}"}
    

    
    def download_video(self, url):
        """Start downloading a video"""
        logger.info(f"Action: download_video url={url}")
        if self.download_thread and self.download_thread.is_alive():
            return {"status": "busy"}
        
        self.download_thread = threading.Thread(
            target=self._run_download,
            args=(url,),
            daemon=True,
        )
        self.download_thread.start()
        return {"status": "started"}
    
    def _run_download(self, url):
        """Run video download"""
        def log_cb(msg):
            self.download_status = str(msg)
            logger.info(f"[Download] {msg}")
        
        def progress_cb(p):
            try:
                self.download_progress = float(p)
            except:
                self.download_progress = 0.0
        
        cfg = self._get_cfg()
        
        cfg = self._get_cfg()
        
        # Extract YouTube ID from URL
        yt_id = None
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com\/embed\/([a-zA-Z0-9_-]{11})',
            r'youtube\.com\/v\/([a-zA-Z0-9_-]{11})'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                yt_id = match.group(1)
                break
        
        if not yt_id:
            raise Exception("Invalid YouTube URL! Cannot extract video ID.")
        
        try:
            self.download_status = "Downloading video..."
            self.download_progress = 0.0
            
            # Check cookies first
            cookies_path = Path(self.cookies_file)
            if not cookies_path.exists():
                raise Exception("Cookies file not found! Please upload cookies.txt first from the Download tab.")
            
            # IMPORTANT: Clean temp folder before download to prevent subtitle mix-up
            self.download_status = "Preparing download..."
            temp_dir = Path(self.downloads_dir) / "_temp"
            # IMPORTANT: Clean temp folder before download to prevent subtitle mix-up
            self.download_status = "Preparing download..."
            temp_dir = Path(self.downloads_dir) / "_temp"
            if temp_dir.exists():
                # Remove all files in temp folder
                for item in temp_dir.glob('*'):
                    try:
                        if item.is_file():
                            item.unlink()
                    except Exception as e:
                        pass  # Ignore errors, continue
            
            # Create core instance with better error handling
            self.download_status = "Initializing download..."
            core = AutoClipperCore(
                client=None,
                ffmpeg_path=get_ffmpeg_path(),
                ytdlp_path="yt_dlp_module",  # Use module instead of subprocess
                output_dir=self.downloads_dir,
                log_callback=log_cb,
                progress_callback=lambda s, p=None: progress_cb(p if p is not None else 0.0),
            )
            
            # Download video - this will return tuple (video_path, subtitle_path, video_info)
            self.download_status = "Downloading from YouTube..."
            result = core.download_video(url)
            
            # Handle different return types from download_video
            if len(result) == 3:
                video_path, subtitle_path, video_info = result
                video_title = video_info.get("title", "Unknown Video")
                self.download_status = f"Title: {video_title}"
            else:
                video_path, subtitle_path = result
                video_title = self._get_video_title(url)
            
            # Rename files to use YouTube ID
            self.download_status = "Saving files..."
            video_src = Path(video_path)
            
            # Create new filenames with YouTube ID
            new_video_path = Path(self.downloads_dir) / f"{yt_id}.mp4"
            new_subtitle_path = Path(self.downloads_dir) / f"{yt_id}.srt"
            
            # Move/rename video
            # Move/rename video
            if video_src.exists():
                # Check if target exists and remove it first to avoid shutil.move errors
                if new_video_path.exists():
                    logger.info(f"Target file exists, overwriting: {new_video_path}")
                    new_video_path.unlink()
                
                shutil.move(str(video_src), str(new_video_path))
                video_path = str(new_video_path)
            else:
                raise Exception("Downloaded video file not found!")
            
            # Handle subtitle carefully - only move if exists and valid
            final_subtitle_path = None
            if subtitle_path:
                subtitle_src = Path(subtitle_path)
                if subtitle_src.exists() and subtitle_src.stat().st_size > 0:
                    # Subtitle exists and not empty
                    # Check if target exists
                    if new_subtitle_path.exists():
                        new_subtitle_path.unlink()
                        
                    shutil.move(str(subtitle_src), str(new_subtitle_path))
                    final_subtitle_path = str(new_subtitle_path)
                else:
                    # Subtitle doesn't exist or empty
                    self.download_status = "Warning: No subtitle available"
            else:
                self.download_status = "Warning: No subtitle downloaded"

            
            # Save to database
            self.download_status = "Saving to database..."
            video_id = yt_id  # Use YouTube ID as database ID
            db = self._read_downloads_db()
            videos = db.get("videos", [])
            
            # Check if already exists (update instead of duplicate)
            existing = next((v for v in videos if v["id"] == video_id), None)
            if existing:
                existing["title"] = video_title
                existing["path"] = str(video_path)
                existing["subtitle_path"] = final_subtitle_path  # Use final_subtitle_path, not subtitle_path
                existing["url"] = url
            else:
                videos.append({
                    "id": video_id,
                    "url": url,
                    "title": video_title,
                    "path": str(video_path),
                    "subtitle_path": final_subtitle_path,  # Use final_subtitle_path, not subtitle_path
                })

            
            db["videos"] = videos
            self._write_downloads_db(db)
            
            self.download_status = "complete"
            self.download_progress = 1.0
        except Exception as e:
            error_msg = str(e)
            # Provide user-friendly error messages
            if "cookies" in error_msg.lower():
                self.download_status = f"error: Cookies required! Please upload cookies.txt file."
            elif "format is not available" in error_msg.lower():
                self.download_status = f"error: Video format issue. Try updating yt-dlp or check cookies."
            elif "sign in" in error_msg.lower() or "bot" in error_msg.lower():
                self.download_status = f"error: Cookies expired. Please upload fresh cookies.txt"
            else:
                # Show first 150 chars of error
                self.download_status = f"error: {error_msg[:150]}"
        finally:
            self.download_thread = None
    
    def _get_video_title(self, url):
        """Get video title from URL using yt-dlp"""
        try:
            import yt_dlp
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return info.get('title', 'Unknown Video')
        except:
            return 'Unknown Video'
    
    def get_download_progress(self):
        """Get download progress"""
        return {"status": self.download_status, "progress": self.download_progress}
    
    def delete_downloaded_video(self, video_id):
        """Delete downloaded video from database and filesystem"""
        logger.info(f"Action: delete_downloaded_video id={video_id}")
        try:
            db = self._read_downloads_db()
            videos = db.get("videos", [])
            
            # Find video
            video = next((v for v in videos if v["id"] == video_id), None)
            if not video:
                logger.warning(f"Video not found for deletion: {video_id}")
                return {"status": "error", "message": "Video not found"}
            
            # Delete physical files
            video_path = Path(video.get("path", ""))
            subtitle_path = Path(video.get("subtitle_path", "")) if video.get("subtitle_path") else None
            
            if video_path.exists():
                video_path.unlink()
            
            if subtitle_path and subtitle_path.exists():
                subtitle_path.unlink()
            
            # Remove from database
            videos = [v for v in videos if v["id"] != video_id]
            db["videos"] = videos
            self._write_downloads_db(db)
            
            self._write_downloads_db(db)
            
            logger.info(f"Successfully deleted video: {video_id}")
            return {"status": "success", "message": "Video deleted"}
        except Exception as e:
            logger.error(f"Error deleting video {video_id}: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}
    
    def browse_file(self, file_types="All files (*.*)"):
        """Open file dialog to browse for a file"""
        if len(webview.windows) > 0:
            result = webview.windows[0].create_file_dialog(webview.OPEN_DIALOG, file_types=tuple(file_types.split(';')))
            if result and len(result) > 0:
                logger.info(f"Browsed file: {result[0]}")
                return result[0]
        return None

    def get_downloaded_videos(self):
        """Get list of downloaded videos"""
        logger.info("Action: get_downloaded_videos")
        db = self._read_downloads_db()
        videos = db.get("videos", [])
        return videos
    
    def start_clipping(self, video_id, timestamps, add_captions=True, add_hook=False, subtitle_lang="id", watermark_path=None, smart_crop=True, resolution="9:16"):
        """Start clipping process from a downloaded video"""
        logger.info(f"Action: start_clipping video={video_id} captions={add_captions} hook={add_hook} crop={smart_crop} res={resolution}")
        
        if self.clipping_thread and self.clipping_thread.is_alive():
            logger.warning("Clipping thread is busy")
            return {"status": "busy"}
        
        # Get video from database
        db = self._read_downloads_db()
        videos = db.get("videos", [])
        video = next((v for v in videos if v["id"] == video_id), None)
        
        if not video:
            logger.warning(f"Video not found. ID={video_id}")
            return {"status": "error", "message": "Video not found"}
        
        logger.info(f"Starting clipping thread for video: {video.get('title')}")
        self.clipping_thread = threading.Thread(
            target=self._run_clipping,
            args=(video, timestamps, add_captions, add_hook, subtitle_lang, watermark_path, smart_crop, resolution),
            daemon=True,
        )
        self.clipping_thread.start()
        return {"status": "started"}
    
    def _run_clipping(self, video, timestamps, add_captions, add_hook, subtitle_lang, watermark_path, smart_crop, resolution):
        """Run clipping process"""
        logger.info(f"Running clipping process. Watermark: {watermark_path}, Crop: {smart_crop}")
        def log_cb(msg):
            self.clipping_status = str(msg)
            logger.info(f"[Clipping] {msg}")
        
        def progress_cb(p):
            try:
                self.clipping_progress = float(p)
            except:
                self.clipping_progress = 0.0
        
        cfg = self._get_cfg()
        system_prompt = cfg.get("system_prompt", None)
        temperature = cfg.get("temperature", 1.0)
        tts_model = cfg.get("tts_model", "tts-1")
        watermark_settings = cfg.get("watermark", {"enabled": False})
        credit_watermark_settings = cfg.get("credit_watermark", {"enabled": False})
        face_tracking_mode = cfg.get("face_tracking_mode", "mediapipe")
        mediapipe_settings = cfg.get("mediapipe_settings", {
            "lip_activity_threshold": 0.15,
            "switch_threshold": 0.3,
            "min_shot_duration": 90,
            "center_weight": 0.3
        })
        output_dir = cfg.get("output_dir", str(get_app_dir() / "output"))
        model = cfg.get("model", "gpt-4.1")
        ai_providers = cfg.get("ai_providers")
        
        # Override with UI settings
        if watermark_path:
            watermark_settings = {"enabled": True, "path": watermark_path, "opacity": 0.8, "scale": 0.15, "position": "top_right"}
        
        if not smart_crop:
            face_tracking_mode = "center" # Fallback to center crop
        
        core = AutoClipperCore(
            client=None,
            ffmpeg_path=get_ffmpeg_path(),
            ytdlp_path=get_ytdlp_path(),
            output_dir=output_dir,
            model=model,
            tts_model=tts_model,
            temperature=temperature,
            system_prompt=system_prompt,
            watermark_settings=watermark_settings,
            credit_watermark_settings=credit_watermark_settings,
            face_tracking_mode=face_tracking_mode,
            mediapipe_settings=mediapipe_settings,
            ai_providers=ai_providers,
            subtitle_language=subtitle_lang,
            log_callback=log_cb,
            progress_callback=lambda s, p=None: progress_cb(p if p is not None else 0.0),
        )
        
        try:
            self.clipping_status = "Processing clips..."
            self.clipping_progress = 0.0
            
            # Helper to parse timestamps
            def parse_ts(ts):
                if isinstance(ts, (int, float)): return float(ts)
                if isinstance(ts, str):
                    try:
                        ts = ts.replace(',', '.').strip()
                        parts = ts.split(':')
                        if len(parts) == 3: return float(parts[0])*3600 + float(parts[1])*60 + float(parts[2])
                        if len(parts) == 2: return float(parts[0])*60 + float(parts[1])
                        return float(ts)
                    except: return 0.0
                return 0.0

            # Convert timestamps to the format expected by AutoClipperCore
            # Expected format: [{"start": 10, "end": 25, "title": "Clip 1"}, ...]
            manual_highlights = []
            for ts in timestamps:
                start_val = ts.get("start", ts.get("start_time", 0))
                end_val = ts.get("end", ts.get("end_time", 0))
                
                manual_highlights.append({
                    "start_time": parse_ts(start_val),
                    "end_time": parse_ts(end_val),
                    "title": ts.get("title", "Clip"),
                    "reason": ts.get("reason", ""),
                    "hook_text": ts.get("hook_text", "")
                })
            
            # Process clips directly from the downloaded video
            video_path = video["path"]
            
            # Get video info
            video_info = {"title": video.get("title", "Unknown")}
            
            # Process each clip
            for index, highlight in enumerate(manual_highlights):
                core.process_clip(
                    video_path=video_path,
                    highlight=highlight,
                    index=index,
                    total_clips=len(manual_highlights),
                    add_captions=add_captions,
                    add_hook=add_hook
                )
            
            self.clipping_status = "complete"
            self.clipping_progress = 1.0
            logger.info("Clipping completed successfully")
        except Exception as e:
            logger.error(f"Clipping failed: {e}", exc_info=True)
            self.clipping_status = f"error: {e}"
        finally:
            self.clipping_thread = None
    
    def get_clipping_progress(self):
        """Get clipping progress"""
        return {"status": self.clipping_status, "progress": self.clipping_progress}



def main():
    api = WebAPI()
    logger.info("Application starting...")
    app_dir = get_app_dir()
    bundle_dir = get_bundle_dir()
    html_path = Path(bundle_dir) / "web" / "index.html"
    window = webview.create_window("YT Short Clipper", str(html_path), js_api=api)
    webview.start()


if __name__ == "__main__":
    main()
