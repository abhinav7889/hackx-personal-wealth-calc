from flask import Flask
from flask_cors import CORS
from selenium import webdriver
import datetime
import json
import os
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from dotenv import load_dotenv
from azure.data.tables import TableServiceClient

load_dotenv()

app = Flask(__name__)
CORS(app)

def scrape_nifty():

    driver = webdriver.Chrome()
    driver.get("https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050")
    page_source: str = driver.page_source
    page_source = page_source.replace("<html><head><meta name=\"color-scheme\" content=\"light dark\"></head><body><pre style=\"word-wrap: break-word; white-space: pre-wrap;\">", "")
    page_source = page_source.replace("</pre></body></html>", "")
    data = json.loads(page_source)
    driver.quit()

    data["timestamp"] = datetime.datetime.now().timestamp()

    return json.dumps(data).encode('utf-8')


def check_and_update_blob():
        # Create a BlobServiceClient object
        connect_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
        blob_service_client = BlobServiceClient.from_connection_string(connect_str)

        # Create a ContainerClient object
        container_name = os.getenv("AZURE_CONTAINER_NAME")
        container_client = blob_service_client.get_container_client(container_name)

        # Check if the blob exists
        blob_name = 'nifty50data.json'
        blob_client = container_client.get_blob_client(blob_name)
        current_timestamp = datetime.datetime.now()

        data_bytes = None
        if blob_client.exists():
            # Get the blob properties
            data_bytes = read_blob()

            # Calculate the difference between the timestamps
            diff = current_timestamp.timestamp() - float(data_bytes["timestamp"])

            # If the difference is more than 30 minutes, update the blob
            if diff > 30 * 60 * 1000:
                # Scrape the data
                data_bytes = scrape_nifty()

                blob_client.upload_blob(data_bytes, overwrite=True)
        else:
             data_bytes = scrape_nifty()
             blob_client.upload_blob(data_bytes, overwrite=True)


        return data_bytes

@app.route("/")
def get_root():

    return check_and_update_blob()

def read_blob():
            # Create a BlobServiceClient object
            connect_str = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
            blob_service_client = BlobServiceClient.from_connection_string(connect_str)

            # Create a ContainerClient object
            container_name = os.getenv("AZURE_CONTAINER_NAME")
            container_client = blob_service_client.get_container_client(container_name)

            # Get the blob data
            blob_name = 'nifty50data.json'
            blob_client = container_client.get_blob_client(blob_name)
            blob_data = blob_client.download_blob().readall()

            # Parse the JSON data
            json_data = json.loads(blob_data)

            return json_data

if __name__ == '__main__':
    app.run()
