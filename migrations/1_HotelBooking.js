const HotelBooking = artifacts.require("./HotelBooking.sol");

module.exports = function (deployer) {

  // Define your roomIds and roomPrices arrays here
  //const roomIds = [1,2,3,4,5,6,7,8,9,10];
  //const roomPrices = [100,150,200,250,300,350,400,450,500,550];

  deployer.deploy(HotelBooking);
};

