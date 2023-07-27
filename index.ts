import * as puppeteer from "puppeteer";
import { Page } from "puppeteer";
import { wait } from "./utils";

const targetedCategories = ["15", "16"];
// const maximumPrice = "65";

async function startScraping() {
    console.log("Start scrapping " + new Date());

    const browser = await puppeteer.launch({
        headless: "new",
        // headless: false,

        slowMo: 50,
    });

    const result: Record<string, Record<string, number>> = {};

    const page: Page = await browser.newPage();

    await page.goto("https://billetterie.psg.fr/fr/ticketplace");

    await wait(5000, true);

    await page.click(".didomi-continue-without-agreeing");

    await wait(3000, true);

    const ticketPlaceButtons = await page.$$(
        ".psgMatchCardLinks > a:nth-child(2)"
    );

    const visitingTeams = await page.$$(
        ".psgMatchCardTitle > span > span > span:nth-child(5)"
    );

    await wait(1000, true);

    for (let index = 0; index < ticketPlaceButtons.length; index++) {
        const button = ticketPlaceButtons[index];
        const visitingTeam = visitingTeams[index];
        const visitingTeamName = (await visitingTeam.getProperty("textContent"))
            .toString()
            .replace("JSHandle:", "")
            .trim();

        console.log(
            `Scrapping begins for PSG - ${visitingTeamName} match ----------------------`
        );

        const link = await button.getProperty("href");

        const matchPage = await browser.newPage();

        await matchPage.goto(link.toString().replace("JSHandle:", ""));

        await wait(1300, true);

        await matchPage.click(".psgTicketplaceFastest button");

        await wait(1300, true);

        const categoriesToggle = await matchPage.$$(
            "button.bookingCategoryToggle"
        );

        const filteredCategories = await Promise.all(
            categoriesToggle.map(async (category) => {
                const categoryName = await category.getProperty("textContent");

                const categoryNumber = categoryName
                    .toString()
                    .replace("JSHandle:", "")
                    .trim()
                    .split(" ")[1]
                    .trim();

                if (targetedCategories.includes(categoryNumber)) {
                    return { category, categoryNumber };
                }

                return undefined;
            })
        );

        for (let index = 0; index < filteredCategories.length; index++) {
            const category = filteredCategories[index];

            let categoryMinimumPrice: number | undefined = undefined;

            if (!category) continue;

            console.log(
                `Price check for category ${category?.categoryNumber}...`
            );

            await category.category.click();

            await wait(2000, true);

            const accessButtons = await matchPage.$$(
                `.bookingCategory:nth-child(${index + 1}) .bookingBlockBtn`
            );

            for (let index = 0; index < accessButtons.length; index++) {
                const element = accessButtons[index];

                await element.click();

                await wait(2000, true);

                await matchPage.click(".bookingBackButton");

                await wait(2000, true);

                const firstPriceSpan = await matchPage.$(
                    ".bookingResaleTogglePrice span:nth-child(2)"
                );

                const firstPrice = (
                    await firstPriceSpan?.getProperty("textContent")
                )
                    ?.toString()
                    .replace("JSHandle:", "")
                    .split(",")[0]
                    .replace(/\s/g, "");

                const firstPriceNumber = firstPrice ? +firstPrice : undefined;

                if (!firstPriceNumber) {
                    console.log(`Invalid price ${firstPriceNumber}`);
                } else if (firstPriceNumber && !categoryMinimumPrice) {
                    console.log(
                        `First prize found for category ${category.categoryNumber} : ${firstPriceNumber}`
                    );
                    categoryMinimumPrice = firstPriceNumber;
                } else if (
                    categoryMinimumPrice &&
                    firstPriceNumber &&
                    categoryMinimumPrice <= firstPriceNumber
                ) {
                    console.log(`The price is no lower : ${firstPriceNumber}`);
                } else if (firstPriceNumber) {
                    console.log(`The price is lower : ${firstPriceNumber}`);
                    categoryMinimumPrice = firstPriceNumber;
                }

                await category.category.click();

                await wait(1000, true);
            }

            if (categoryMinimumPrice) {
                console.log(
                    `The minimum price for category  ${category.categoryNumber} for the PSG - ${visitingTeamName} match is : ${categoryMinimumPrice}€`
                );
                if (!result[visitingTeamName]) result[visitingTeamName] = {};
                result[visitingTeamName][category.categoryNumber] =
                    categoryMinimumPrice;

                console.log(result);
            } else
                console.log(
                    `No prizes for category ${category.categoryNumber}`
                );
        }
    }

    console.log("Stop scrapping " + new Date());

    return result;
}

try {
    startScraping();
} catch (error) {
    console.log(error);
}
