
function random_triangular(a, b, c) {
    var fc;
    var x;
    var u;
    fc = (c - a) / (b - a);
    u = Math.random();
    if (u < fc) {
        x = (b - a) * (c - a);
        return a + Math.sqrt(x * u);
    }
    x = (b - a) * (b - c);
    return b - Math.sqrt(x * (1.0 - u));
}

function random_normal() {
    return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random())
}

function linspace(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}

function percentile(arr, q) {
    const sorted = arr.sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
};

function monte_carlo_discounted_cash_flow(n_trials, n_periods, p_0, r_0, dr_0, r_n, dr_n, S_0, m, dm, terminal_multiple, discount_rate, cash, debt) {

    let r_arr = linspace(r_0, r_n, n_periods);
    let dr_arr = linspace(dr_0, dr_n, n_periods);

    let cash_flow_matrix = [];
    let discounted_cash_flow_matrix = [];
    let fair_value_arr = [];

    for (let i = 0; i < n_trials; i++) {
        let sales = S_0;

        let cash_flow_arr = [];
        let discounted_cash_flow_arr = [];

        let discounted_cash_flow_sum = 0;

        for (let j = 0; j < n_periods; j++) {
            sales = sales * (dr_arr[j] * random_normal() + r_arr[j]);

            let cash_flow = sales * random_triangular(m - dm, m, m + dm);
            cash_flow_arr.push(cash_flow);

            let discounted_cash_flow = cash_flow * (1 / (1 + discount_rate) ** (j + 1));
            discounted_cash_flow_arr.push(discounted_cash_flow);

            discounted_cash_flow_sum = discounted_cash_flow_sum + discounted_cash_flow;
        }

        cash_flow_matrix.push(cash_flow_arr);
        discounted_cash_flow_matrix.push(discounted_cash_flow_arr);

        let fair_value = discounted_cash_flow_sum + discounted_cash_flow_arr[n_periods - 1] * terminal_multiple + cash - debt;

        fair_value_arr.push(fair_value);
    }

    let fair_value = percentile(fair_value_arr, 0.5);
    let p_undervalued = fair_value_arr.filter(x => x > p_0).length / n_trials;

    let bin_edges = [];
    let p_undervalued_arr = [];
    let hist = [];

    let p_1 = percentile(fair_value_arr, 0.01);
    let p_99 = percentile(fair_value_arr, 0.99);
    let range = p_99 - p_1;

    for (let i = 1; i <= 200; i++) {
        let bin_edge = p_1 + range / 200 * i;
        bin_edges.push(bin_edge);
        p_undervalued_arr.push(fair_value_arr.filter(x => x > bin_edge).length / n_trials);
        hist.push(fair_value_arr.filter(x => x > bin_edge && x <= bin_edge + range / 200).length);
    }

    return {
        'fair_value': fair_value,
        'p_undervalued': p_undervalued,
        'cash_flow_matrix': cash_flow_matrix.slice(0, 100),
        'mean_cash_flow': cash_flow_matrix.reduce((r, a) => r.map((b, i) => b + a[i])).map(x => x / n_trials),
        'discounted_cash_flow_matrix': discounted_cash_flow_matrix.slice(0, 100),
        'mean_discounted_cash_flow': discounted_cash_flow_matrix.reduce((r, a) => r.map((b, i) => b + a[i])).map(x => x / n_trials),
        'hist': hist,
        'bin_edges': bin_edges,
        'p_undervalued_arr': p_undervalued_arr
    }
}

console.log(monte_carlo_discounted_cash_flow(100000, 10, 100, 1.3, 0.3, 1.04, 0.16, 10, 0.3, 0.1, 15, 0.1, 0, 0)['fair_value'])