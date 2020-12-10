// Use Firefox in node_modules
process.env.PLAYWRIGHT_BROWSERS_PATH = 0;

class PlaywrightTask {
  constructor({ link }) {
    this.timesUpdate = 0;
    this.link = link;
    this.pw = require("playwright-firefox");
    this.headless = true;
  }

  async postScreenShot() {
    let AWS = require("aws-sdk");
    AWS.config.update({
      region: "us-east-1",
      // accessKeyId: "****************",
      // secretAccessKey: "*******************",
    });
    this.timesUpdate += 1;
    const s3 = new AWS.S3();
    const bucket = "playwright-docker-test-screenshots";
    const key = `DockerTest-Screenshot.jpg`;
    const screenshot = await this.page.screenshot({ fullPage: false });
    const params = {
      Bucket: bucket,
      Key: key,
      Body: screenshot,
      ContentType: "image/jpeg",
      ACL: "public-read",
    };

    // Comment this line to out to disable Upload of Screenshot to bucket
    // await s3.putObject(params).promise();

    var url = `https://${bucket}.s3.amazonaws.com/DockerTest-Screenshot.jpg`;
    console.log(`Screenshot uploaded to:
  ${url}`);
    return url;
  }

  async createBrowser() {
    this.browser = await this.pw.firefox.launch({
      headless: this.headless,
      slowMo: 40,
    });
  }

  async launchPage() {
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async scrapeScreenshot() {
    try {
      console.log("Starting Task...");
      await this.createBrowser();
      console.log("Browser Launched");
      await this.launchPage();
      console.log("Page Launched");
      console.log(`Going to ${this.link}`);
      await this.page.goto(this.link, {
        waitUntil: "networkidle0",
        timeout: 0,
      });
      const url = await this.postScreenShot();
      await this.browser.close();
      console.log("Done!");
      return url;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

exports.lambdaHandler = async event => {
  try {
    console.log("Event: ", event);
    const task = new PlaywrightTask({ link: "https://www.reddit.com" });
    const url = await task.scrapeScreenshot();
    const response = {
      statusCode: 200,
      body: url,
    };
    return response;
  } catch (e) {
    const response = {
      statusCode: 500,
      error: e,
    };
    return response;
  }
};

// Run outside of container
async function test() {
  const task = new PlaywrightTask({ link: "https://www.reddit.com" });
  const url = await task.scrapeScreenshot();
  console.log({ url });
}
// test();
