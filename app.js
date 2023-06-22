// Require the modules
const request = require('request');
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const gplay = require('google-play-scraper');
///

const app = express();

//fb

app.get('/download/fb/:fburl', async (req, res) => {
// Define the facebook video url
const fb_video_url = req.params.fburl;

// Extract the video id from the url
const video_id = fb_video_url.split('v=')[1];

// Define the access token (you can get it from https://developers.facebook.com/tools/explorer/)
const access_token = 'EAAOQVRgZABuYBANZCEswORtObxXtUZCmuNgZAHIrm4pPYhoSZBDwKRiwqTpZC0UDta7swXGkuDxG4ZAlWZCMiWrEdZACsDuG3MCrAhjDsbe4GmsCFFvOO80r8P2mkSOOw8GAI9KitvH84ytm5kA6kFkiarFCcD71gArFGj306XWwszfidZCOXvITPU2JKZCp3qcpR2eEg1jib4o371RTS3Ab3RWZBVOfpbrIbP8ZD';

// Define the graph api endpoint
const graph_api_url = `https://graph.facebook.com/v10.0/${video_id}?fields=source&access_token=${access_token}`;

// Make a GET request to the graph api
request.get(graph_api_url, (error, response, body) => {
  if (error) {
    console.error(error);
  } else {
    // Parse the response body as JSON
    const data = JSON.parse(body);

    // Check if the source field exists
    if (data.source) {
      // Define the output file name
      const output_file = `${video_id}.mp4`;

      // Create a write stream
      const write_stream = fs.createWriteStream(output_file);

      // Make a GET request to the video source and pipe it to the write stream
      request.get(data.source).pipe(write_stream);

      // Log a success message when done
      write_stream.on('finish', () => {
        res.sendFile(output_file);
        console.log(`Video downloaded successfully as ${output_file}`);
      });
    } else {
      // Log an error message if no source found
      res.status(500).send(error.message);
      console.error('No video source found');
    }
  }
});
});

//apk

app.get('/download/apk/:appId', async (req, res) => {
  // Get the app id from the request parameters
  const appId = req.params.appId;

  // Try to get the app details from the Play store
  try {
    const appDetails = await gplay.app({appId: appId});
    const downloadUrl = appDetails.url;
    const fileName = `${appId}.apk`;
    res.sendFile(downloadUrl);
  } catch (error) {
    // Handle any errors
    res.status(500).send(error.message);
  }
});

//tiktok
app.get('/download/tiktok/:tkurl', async (req, res) => {
  // Get the video url from the query parameter
  const videoUrl = req.params.tkurl;

  // Check if the video url is valid
  if (!videoUrl || !videoUrl.startsWith('https://www.tiktok.com/')) {
    // Send an error message
    res.status(400).send('Invalid video url');
    return;
  }

  try {
    // Fetch the video page
    const response = await axios.get(videoUrl);

    // Load the html into cheerio
    const $ = cheerio.load(response.data);

    // Find the script tag that contains the video data
    const scriptTag = $('script[id="__NEXT_DATA__"]').html();

    // Parse the script tag as JSON
    const videoData = JSON.parse(scriptTag);

    // Get the video id from the video data
    const videoId = videoData.props.pageProps.itemInfo.itemStruct.id;

    // Construct the api url for getting the video info
    const apiUrl = `https://www.tiktok.com/node/video/playwm/${videoId}`;

    // Fetch the api url
    const apiResponse = await axios.get(apiUrl, {
      headers: {
        // Set the referer header to bypass the watermark
        referer: videoUrl,
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 302,
    });

    // Get the location header from the api response
    const location = apiResponse.headers.location;

    // Send the location as the download link
    res.send(location);
  } catch (error) {
    // Send an error message
    res.status(500).send('Something went wrong');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
