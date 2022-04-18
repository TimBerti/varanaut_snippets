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

function portfolio_creator(req) {

    const data = req.body;

    let sql = `
        SELECT DISTINCT ON (name) name, ticker, cluster, combined_score
            FROM companies_display 
            WHERE cluster IS NOT NULL
            AND combined_score IS NOT NULL
            AND implied_volatility > 0
            AND implied_volatility_ranker <= ${data.risk_coefficient}
            AND sector != 'Financial Services'
    `;

    if (data.esg) {
        sql = sql.concat(`
            AND esg
        `);
    }

    if (data.dividend) {
        sql = sql.concat(`
            AND dividend_yield > 1.5
        `);
    }

    if (data.value) {
        sql = sql.concat(`
            AND price_earnings_ranker + price_book_ranker > 1
        `);
    }

    if (data.growth) {
        sql = sql.concat(`
            AND revenue_growth_3y_ranker > 0.6
        `);
    }

    client.query(sql, (err, res) => {
        if (err) {
            console.log(err);
        }

        let companies = res.rows;

        companies = companies.sort((a, b) => a.combined_score > b.combined_score ? -1 : 1);

        let clusters = new Set(companies.map(company => company.cluster));

        let n_clusters = clusters.size;
        let n_positions = data.n_positions;
        let n_0 = Math.floor(n_positions / n_clusters);
        let n;
        let positions = [];

        for (let i = 0; i < n_clusters; i++) {
            n = i < n_positions % n_clusters ? n_0 + 1 : n_0;
            positions = positions.concat(companies.filter(company => company.cluster == i).slice(0, n).map(company => company.ticker));
        }

        console.log(positions);
    });
}

portfolio_creator({ 'body': { 'risk_coefficient': 1, 'n_positions': 15, 'esg': true } })
