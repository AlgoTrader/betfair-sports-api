var BetfairPrice = require('../lib/betfair_price.js').BetfairPrice;

console.log("Betfair price extreme values:")
console.log('Price below 1.01 test: %s', new BetfairPrice(1.0).toString());
console.log('Price below above 1000 test: %s', new BetfairPrice(1001.0).toString());

console.log("Test rounding of betfair prices:")
console.log('Price 1.01-2.00 rounded to 0.01    %s', new BetfairPrice(1.1234567).toString());
console.log('Price 2.00-3.00 rounded to 0.02    %s', new BetfairPrice(2.2345678).toString());
console.log('Price 3.00-4.00 rounded to 0.05    %s', new BetfairPrice(3.2345678).toString());
console.log('Price 4.00-6.00 rounded to 0.1     %s', new BetfairPrice(4.2345678).toString());
console.log('Price 6.00-10.00 rounded to 0.2    %s', new BetfairPrice(7.2345678).toString());
console.log('Price 10.00-20.00 rounded to 0.5   %s', new BetfairPrice(11.678901).toString());
console.log('Price 20.00-30.00 rounded to 1     %s', new BetfairPrice(21.2345678).toString());
console.log('Price 30.00-50.00 rounded to 2     %s', new BetfairPrice(31.2345678).toString());
console.log('Price 50.00-100.00 rounded to 5    %s', new BetfairPrice(66.2345678).toString());
console.log('Price 100.00-1000.00 rounded to 10 %s', new BetfairPrice(123.2345678).toString());

console.log("Test accending prices:")
var cnt = 0;
var price = new BetfairPrice(1.01);
while(true) {
    console.log('index:%s price:%s',cnt,price.toString());
    if(price.toString()==='1000')
        break;
    price.increasePrice();
    ++cnt;
}

console.log("Test decending prices:")
var cnt = 0;
var price = new BetfairPrice(1000.0);
while(true) {
    console.log('index:%s price:%s',cnt,price.toString());
    if(price.toString()==='1.01')
        break;
    price.decreasePrice();
    ++cnt;
}