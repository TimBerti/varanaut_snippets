const math = require('mathjs')

let a = 0;
let b = 8;
let c = 10;
let n = 100000;

function random_triangular(a, b, c) {

    function triangular_density(x) {
        if (x <= b) {
            return (2 * x / ((c - a) * (b - a)) - 2 * a / ((c - a) * (b - a)));
        } else {
            return (-2 * x / ((c - a) * (c - a)) + 2 * c / ((c - a) * (c - a)));
        }
    }

    let x = null;

    while (x == null) {

        let y = (c - a) * math.random() + a;
        let threshold = math.random();

        if (triangular_density(y) > threshold) {
            x = y;
        }
    }

    return x;
}

arr = [];

for (let i = 0; i < n; i++) {
    arr.push(math.round(random_triangular(a, b, c)));
}

// for (let i = a; i <= c; i++) {
//     n = arr.filter(x => x == i).length
//     console.log('_'.repeat(n))
// }
