// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");


// NOTE: A better practice would be to pull these into their own files and/or directories
/** 
 * Defined maximum number of articles
 *  @type {number}
 */
const MAX_ARTICLES = 100;

/**
 * Time Segment types
 * @type {string}
 */
const timeSegments = Object.freeze({
    Year: "year",
    Day: "day",
    Hour: "hour",
    Minute: "minute",
});

/**
 * CSS Classes for parsing
 * @type {string}
 */
const cssClass = Object.freeze({
    /** Container for each article */
    Article: ".athing",
    /** Gets the anchor tag for the title class */
    Title: ".titleline a",
    /** Timestamp for the article */
    Age: ".age",
    /** Selects the next page */
    More: ".morelink",
});

/**
 * Define time units
 * @type {Object<string, number>}
 */
const timeUnits = Object.freeze({
    [timeSegments.Year]: 365 * 24 * 60 * 60 * 1000,
    [timeSegments.Day]: 24 * 60 * 60 * 1000,
    [timeSegments.Hour]: 60 * 60 * 1000,
    [timeSegments.Minute]: 60 * 1000,
});

/** Represents an article object */
class ArticleData {
    constructor(title, time) {
        /**
         * Title of the article
         * @type {string}
         */
        this.Title = title;

        /**
         * Timestamp of the article in milliseconds
         * @type {number}
         */
        this.TimeStamp = time;
    }

    /**
     * Converts the object to a string without importing JSON
     * @returns {string}
     */
    Stringify() {
        return `${this.Title} -- ${this.TimeStamp}`
    }
}

async function saveHackerNewsArticles() {
    console.log("Opening browser");
    // launch browser
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // go to Hacker News
    await page.goto("https://news.ycombinator.com/newest");

    console.log("Gathering articles");
    // Get the since posting in miliseconds
    const getTimestamp = (time) => {
        // "2 Hours Ago" -> value = ["2"]; unit = ["Hours", "Ago"]
        const [value, unit] = time.split(" ");
        // ["Hours", "Ago"] -> 60 * 60 * 1000
        let mult = timeUnits[unit.replace("s", "")]; 

        if (!mult) {
            console.error(`Error: ${time}`);
        }

        // Get the duration since posting
        const now = new Date();
        let timestamp = now.getTime() - (parseInt(value, 10) * mult);
        return timestamp;
    };

    // Get the articles
    let articles = [];
    while (articles.length < MAX_ARTICLES) {
        // Collect each page's articles
        const newArticles = await page.evaluate((cssClass) => {
            // Get all of the relevant rows
            const rows = document.querySelectorAll(cssClass.Article);
            let articleData = [];

            rows.forEach((row) => {
                // Get the title from each row
                const title = row.querySelector(cssClass.Title).innerText;
                // Get the timestamp from the sebsequent row
                const time = row.nextElementSibling.querySelector(cssClass.Age).innerText;
                articleData.push({ title, time });
            })
            
            return articleData;
        }, cssClass);

        // Create the article objects and place in the articles array
        // NOTE: Even though it's small, following a proper process is probably the way to go
        for (let article of newArticles) {
            let timestamp = getTimestamp(article.time);
            articles.push(new ArticleData(article.title, timestamp));
        }

        // Wait a second to prevent too many requests happening at once
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Go to the next page
        await page.locator(cssClass.More).first().click();
    }

    // Cut down the list of articles to 100
    articles = articles.slice(0, MAX_ARTICLES);

    console.log(`${articles.length} articles gathered, comparing timestamps...`);
    // Testing purposes
    // for (let i = 0; i < articles.length; ++i) {
    //     console.log(`${i + 1} -- ${articles[i].Stringify()}`);
    // }

    // Compare timestamps
    let ordered = true;
    for (let i = 0; i < articles.length - 1; ++i) {
        if (articles[i].TimeStamp < articles[i].TimeStamp) {
            ordered = false;
            // Don't break, giving more information about which ones are breaking may be helpful
            console.log(`Out of order: Articles ${i} and ${i + 1}:\n\t${articles[i]}\n\t${articles[i + 1]}`);
        }
    }

    // Print out the result
    console.log(ordered ? "The articles are ordered correctly" : "The articles are not ordered correctly");

    await browser.close();
}

(async () => {
    await saveHackerNewsArticles();
})();
