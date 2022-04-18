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

const merge_on_columns_n_m = (arr1, arr2, n, m) =>
    arr1.map(x1 =>
        x1.concat(arr2.find(x2 =>
            x1[n] == x2[m]
        ).filter((_, i) => i != m)
        )
    )

const sharpe = (close, risk_free_rate) => {

    let current_date = new Date().getTime();
    close = close.filter(x => x[0] >= current_date - 3.156e+10);
    risk_free_rate = risk_free_rate.filter(x => x[0] >= current_date - 3.156e+10);
    risk_free_rate = risk_free_rate.map(x => [x[0], ((x[1] / 100 + 1) ** (1 / 250) - 1) * 100]);

    let returns = close.slice(1, close.length).map((x, i) => [x[0], (x[1] / close[i][1] - 1) * 100]);
    let excess_returns = merge_on_columns_n_m(returns, risk_free_rate, 0, 0).map(x => x[1] - x[2]);

    let mu = excess_returns.reduce((a, b) => a + b, 0) / excess_returns.length;
    let std = Math.sqrt(excess_returns.reduce((a, b) => a + (b - mu) ** 2, 0) / excess_returns.length);

    return ((mu / 100 + 1) ** excess_returns.length - 1) * 100 / (std * Math.sqrt(excess_returns.length));
}

sql = `
    WITH cte AS (
        SELECT time, close FROM eod WHERE ticker = 'US10Y.GBOND' ORDER BY time
    )
    SELECT ARRAY_AGG(array[EXTRACT(EPOCH FROM time) * 1000, close]) AS arr FROM cte;
`;

client.query(sql, (_, res) => {
    let risk_free_rate = res.rows[0].arr;

    sql2 = `
        WITH cte AS (
            SELECT time, adjusted_close FROM eod WHERE ticker = 'AAPL' ORDER BY time
        )
        SELECT ARRAY_AGG(array[EXTRACT(EPOCH FROM time) * 1000, adjusted_close]) AS arr FROM cte;
    `;

    client.query(sql2, (_, res2) => {
        let close = res2.rows[0].arr;
        console.log(sharpe(close, risk_free_rate));
    });
});