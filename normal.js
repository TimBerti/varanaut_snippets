let mu = 5;
let sigma = 2;
let n = 200;


function random_normal() {
    return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random())
}

arr = [];

for (let i = 0; i < n; i++) {
    arr.push(Math.round(sigma * random_normal() + mu));
}

for (let i = 0; i <= 10; i++) {
    n = arr.filter(x => x == i).length
    console.log('_'.repeat(n))
}