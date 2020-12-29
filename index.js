const app = require("express")();
const bodyParser = require("body-parser");
const htoi = require("node-html-to-image");
const cors = require("cors");
const { decode } = require("js-base64");

app.use(cors({ origin: "*" }));
app.use(bodyParser.json({ limit: "50mb" }));

app.post("/screenshot", async (req, res) => {
  console.log("Request received");
  const { html, scroll, dimensions, origin } = req.body;
  console.log("scroll", scroll.elements);

  const final = addBaseURL(decode(html), origin);
  try {
    await htoi({
      puppeteerArgs: {
        defaultViewport: {
          width: dimensions.viewport.w + 16,
          height: dimensions.page.h,
        },
      },
      output: "./image.png",
      beforeScreenshot: async (page) => {
        console.log("Before Screenshot");
        try {
          await page.evaluate((elements) => {
            const fab = document.getElementById("fab");
            fab.parentNode.removeChild(fab);
            const elems = document.querySelectorAll("body *");
            elems.forEach((elem, index) => {
              elem.scrollTop = elements[index].top;
              elem.scrollLeft = elements[index].left;
            });
          }, scroll.elements);

          const html = await page.$("html");
          await html.screenshot({
            path: "./element.png",
            clip: {
              x: scroll.window.h,
              y: scroll.window.v,
              width: dimensions.page.w - scroll.window.h,
              height: dimensions.viewport.h,
            },
          });
        } catch (error) {
          console.log(error);
        }
      },
      html: final,
    });
    console.log("File Created");
    res.json({ message: "Success" });
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});

app.listen(8000, () => {
  console.log("Express Server Running on port 8000");
});

function addBaseURL(page, baseURL) {
  return insertString(page, `<base href="${baseURL}/" />`, 6);
}

function insertString(origString, stringToAdd, indexPosition) {
  return (
    origString.slice(0, indexPosition) +
    stringToAdd +
    origString.slice(indexPosition)
  );
}
