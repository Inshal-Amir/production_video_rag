import os
from supabase import create_client, Client
from app.core.config import settings

class SupabaseStorage:
    def __init__(self):
        self.url: str = settings.SUPABASE_URL
        self.key: str = settings.SUPABASE_ANON_KEY
        self.bucket: str = settings.SUPABASE_BUCKET
        self.client: Client = create_client(self.url, self.key)

    def upload_file(self, file_path: str, destination_path: str) -> str:
        """
        Uploads a file to Supabase Storage.
        Returns the public URL of the uploaded file.
        """
        try:
            with open(file_path, 'rb') as f:
                self.client.storage.from_(self.bucket).upload(
                    file=f,
                    path=destination_path,
                    file_options={"content-type": "video/mp4", "upsert": "true"}
                )
            return self.get_public_url(destination_path)
        except Exception as e:
            print(f"Error uploading to Supabase: {e}")
            raise e

    def get_public_url(self, path: str) -> str:
        """
        Returns the public URL for a file in Supabase Storage.
        """
        return self.client.storage.from_(self.bucket).get_public_url(path)
    
    def exists(self, path: str) -> bool:
        """
        Checks if a file exists in Supabase Storage.
        """
        try:
            # Check if we can get the metadata
            # This is a more reliable way to check existence than listing
            # However, supabase-py might not have stat() exposed easily on storage3
            # Fallback to list
            folder = os.path.dirname(path)
            filename = os.path.basename(path)
            # Remove leading slash if present for list
            if folder.startswith('/'): folder = folder[1:]
            
            files = self.client.storage.from_(self.bucket).list(folder)
            for f in files:
                if f['name'] == filename:
                    return True
            return False
        except Exception as e:
            print(f"Error checking existence in Supabase: {e}")
            return False

    def download_file(self, path: str, local_destination: str) -> str:
        """
        Downloads a file from Supabase Storage to a local path.
        Returns the local path.
        """
        try:
            with open(local_destination, 'wb+') as f:
                res = self.client.storage.from_(self.bucket).download(path)
                f.write(res)
            return local_destination
        except Exception as e:
            print(f"Error downloading from Supabase: {e}")
            raise e
