const express = require('express');

const app = express();

const cheerio = require('cheerio');
const fetch = require('node-fetch');

// GET /costs/:city

app.get('/costs/:city', async (req, res) => {
    const city =
        req.params.city[0].toUpperCase() +
        req.params.city.slice(1).toLowerCase();

    const URL = `https://costof.live/cost-of-living/in/${city}`;

    const response = await fetch(URL);
    if (response.ok) {
        try {
            const html = await response.text();
            const $ = cheerio.load(html);

            if ($('.table-body').html() === null) {
                return res.status(400).json({
                    error: 'Please provide a valid location. Hint: /costs/city. If there is no error in your code, Cost of Live (https://costof.live) might be unavailable.'
                });
            }

            const statistics = $('.rent-per-month')
                .toArray()
                .map(function (x) {
                    return $(x)
                        .children()
                        .find(
                            '.table-body-row .table-body-row-cell .city-price-row-cost'
                        )
                        .toArray()
                        .map(function (x) {
                            return $(x).text();
                        });
                });

            console.log(statistics[0]);

            const costs = [];
            statistics[0].forEach(stat => {
                const cost = stat
                    .toString()
                    .split(' ')
                    .find(elem => elem.includes('$'));
                costs.push(
                    parseFloat(cost.substr(1, cost.length - 1).replace(',', ''))
                );
            });

            return res.status(200).json({
                costs: {
                    cityCentre: {
                        oneBedroom: costs[0],
                        threeBedrooms: costs[2]
                    },
                    outsideOfCentre: {
                        oneBedroom: costs[1],
                        threeBedrooms: costs[3]
                    }
                }
            });
        } catch (err) {
            return res.status(400).json({ error: 'Something went wrong.' });
        }
    }

    return res
        .status(400)
        .json({ error: 'Cost of Live cannot process this location.' });
});

app.get('*', (req, res) => {
    res.status(400).json({
        error: 'Please provide a location.'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
