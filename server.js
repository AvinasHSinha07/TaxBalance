const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');
const app = express();
const port = 3000;

app.use(express.json());

// Serve static files (Frontend) if any
app.use(express.static('public'));

// Endpoint to fetch tax balance
app.post('/get-tax-balance', async (req, res) => {
    const { propertyId } = req.body;
    if (!propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
    }

    const url = `https://tax-services.phila.gov/TAP/EWebServices/realestate/search/${propertyId}`;
    
    try {
        const browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Extract the tax balance
        const balance = await page.$eval('#fgvt_Dc-d', el => el.textContent.trim());
        await browser.close();

        if (!balance) {
            return res.status(404).json({ error: 'Tax balance not found' });
        }

        return res.json({ propertyId, balance });
    } catch (error) {
        console.error('Error fetching tax balance:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
