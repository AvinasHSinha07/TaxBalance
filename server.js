const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

app.post('/get-tax-balance', async (req, res) => {
    const { propertyId } = req.body;
    if (!propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
    }

    const url = `https://tax-services.phila.gov/TAP/EWebServices/realestate/search/${propertyId}`;

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const balance = await page.$eval('#fgvt_Dc-d', el => el.textContent.trim());
        await browser.close();

        if (balance) {
            return res.json({ propertyId, balance });
        } else {
            return res.status(404).json({ error: 'Tax balance not found' });
        }
    } catch (error) {
        console.error('Error while fetching tax balance:', error);
        return res.status(500).json({ error: 'Failed to fetch tax balance' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
