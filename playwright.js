class PlaywrightTask {
  constructor(payload) {
    // console.log(payload.profile);
    this.timesUpdate = 0;
    this.taskID = payload.taskID;
    this.waveID = payload.waveID;
    this.email = payload.email;
    this.link = payload.link;
    console.log(this.waveID);
    this.userKey = payload.userKey;
    this.pw = require("playwright");
    this.headless = true;
    this.testMode = false;
  }

  async postScreenShot() {
    let AWS = require("aws-sdk");
    AWS.config.update({
      region: "us-east-1",
    });

    this.timesUpdate += 1;
    const s3 = new AWS.S3();
    const bucket = "wake-screenshots";
    const key = `${this.taskID}-${this.timesUpdate}.jpg`;
    const screenshot = await this.page.screenshot({ fullPage: false });
    const params = {
      Bucket: bucket,
      Key: key,
      Body: screenshot,
      ContentType: "image/jpeg",
      ACL: "public-read",
    };
    await s3.putObject(params).promise();
    var url = `https://${bucket}.s3.amazonaws.com/${this.taskID}-${this.timesUpdate}.jpg`;
    console.log(`Screenshot uploaded to:
  ${url}`);
    return url;
  }

  async startTask() {
    console.log("Starting Task...");
    console.time("taskTime");
    this.browser = await this.pw.firefox.launch({
      headless: this.headless,
      slowMo: 40,
    });
    console.log("Browser Launched");
    this.context = await this.browser.newContext({});
    this.page = await this.context.newPage();
    console.log("Page Launched");
    await this.page.goto("http://reddit.com/", {
      waitUntil: "networkidle0",
      timeout: 0,
    });
    await this.postScreenShot();
    await this.browser.close();
    console.log("Done!");
    console.timeEnd("taskTime");
  }
}

async function test() {
  const mockTaskData = {
    taskID: "912d88d2-a836-4fd2-80f7-9220dcd934dd",
    waveID: "c4466a48-0c06-4558-bccf-01f17ce0ff6b",
    userKey: "365ce829-b618-4beb-9073-3f8b078b1865",
    link: "http://reddit.com/",
    email: "camlambda@gmail.com",
  };
  const task = new PlaywrightTask(mockTaskData);
  await task.startTask();
}

// test();

exports.lambdaHandler = async event => {
  const mockTaskData = {
    taskID: "912d88d2-a836-4fd2-80f7-9220dcd934dd",
    waveID: "c4466a48-0c06-4558-bccf-01f17ce0ff6b",
    userKey: "365ce829-b618-4beb-9073-3f8b078b1865",
    link: "http://reddit.com/",
    email: "camlambda@gmail.com",
  };
  console.log("Version 1")
  const task = new PlaywrightTask(mockTaskData);
  await task.startTask();
  const response = {
    statusCode: 200,
    body: event,
  };
  return response;
};
