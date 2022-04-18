let a = 0;
let b = 8;
let c = 10;
let n = 200;

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

arr = [];

for (let i = 0; i < n; i++) {
    arr.push(Math.round(random_triangular(a, b, c)));
}

for (let i = a; i <= c; i++) {
    n = arr.filter(x => x == i).length
    console.log('_'.repeat(n))
}
