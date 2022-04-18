const pg = require("pg");
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

var client = new pg.Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});
client.connect();

function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

function recommendation(req) {
    let portfolio = req.body.portfolio
    let tickers = portfolio.map(position => position.ticker);

    let sql = `
        SELECT ticker, smb_factor, hml_factor, cma_factor, rmw_factor, implied_volatility
        FROM companies_display 
        WHERE ticker IN (${tickers.map(ticker => `'${ticker}'`)})
    `;

    client.query(sql, (err, res) => {
        if (err) {
            console.log(err);
        }

        let portfolio_companies = res.rows;

        let max_portfolio_iv = Math.max(portfolio_companies.map(company => company.implied_volatility));
        let max_iv = max_portfolio_iv > 0 ? 1.1 * max_portfolio_iv : 100;

        let merged = [];

        for (let i = 0; i < portfolio.length; i++) {
            merged.push({
                ...portfolio[i],
                ...(portfolio_companies.find((itmInner) => itmInner.ticker === portfolio[i].ticker))
            }
            );
        }

        portfolio = merged;

        let portfolio_vector = { 'smb_factor': 0, 'hml_factor': 0, 'cma_factor': 0, 'rmw_factor': 0 };

        for (let i = 0; i < portfolio.length; i++) {
            portfolio_vector.smb_factor += isNaN(portfolio[i].smb_factor * portfolio[i].weight) ? 0 : portfolio[i].smb_factor * portfolio[i].weight;
            portfolio_vector.hml_factor += isNaN(portfolio[i].hml_factor * portfolio[i].weight) ? 0 : portfolio[i].hml_factor * portfolio[i].weight;
            portfolio_vector.cma_factor += isNaN(portfolio[i].cma_factor * portfolio[i].weight) ? 0 : portfolio[i].cma_factor * portfolio[i].weight;
            portfolio_vector.rmw_factor += isNaN(portfolio[i].rmw_factor * portfolio[i].weight) ? 0 : portfolio[i].rmw_factor * portfolio[i].weight;
        }

        let sql = `
            WITH cte AS (
                SELECT DISTINCT ON (name) name, ticker, combined_score, smb_factor, hml_factor, cma_factor, rmw_factor
                    FROM companies_display 
                    WHERE ticker NOT IN (${tickers.map(ticker => `'${ticker}'`)})
                    AND combined_score IS NOT NULL
                    AND implied_volatility BETWEEN 1 AND ${max_iv}
                    AND sector != 'Financial Services'
            )
            SELECT 
                ticker,
                combined_score,
                (
                    smb_factor * ${portfolio_vector.smb_factor} + 
                    hml_factor * ${portfolio_vector.hml_factor} + 
                    cma_factor * ${portfolio_vector.cma_factor} + 
                    rmw_factor * ${portfolio_vector.rmw_factor}
                ) / NULLIF(
                    sqrt(
                        smb_factor * smb_factor + 
                        hml_factor * hml_factor + 
                        cma_factor * cma_factor + 
                        rmw_factor * rmw_factor
                    )
                , 0) AS inner_product
            FROM cte;
        `;

        client.query(sql, (err, res2) => {
            if (err) {
                console.log(err);
            }
            let companies = res2.rows;

            companies = companies.sort((a, b) => a.inner_product > b.inner_product ? -1 : 1);
            let similar_150 = companies.slice(0, 150)
            let dissimilar_150 = companies.slice(companies.length - 150, companies.length)

            let best_similar_10 = similar_150.sort((a, b) => a.combined_score > b.combined_score ? -1 : 1).slice(0, 10);
            let best_dissimilar_10 = dissimilar_150.sort((a, b) => a.combined_score > b.combined_score ? -1 : 1).slice(0, 10);

            let res = {
                'similar': getRandomSubarray(best_similar_10, 3).map(x => x.ticker),
                'diversification': getRandomSubarray(best_dissimilar_10, 3).map(x => x.ticker)
            }

            console.log(res);
        });
    });
}

recommendation({ "body": { "portfolio": [{ "ticker": "VRTX", "weight": 0.2 }, { "ticker": "MSFT", "weight": 0.2 }, { "ticker": "META", "weight": 0.2 }, { "ticker": "GE", "weight": 0.2 }, { "ticker": "NFLX", "weight": 0.2 }] } })