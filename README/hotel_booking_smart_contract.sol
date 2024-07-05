// SPDX-License-Identifier: MIT
// Compiler version must be greater than or equal to 0.8.17 and less than 0.9.0

pragma solidity ^0.8.17;

contract HotelBooking
{

    address public owner;

    struct Reservation {
        address guest;
        uint256 roomId;
        uint256 startDate;
        uint256 endDate;
        bool isPaid;
    }

    struct Room {
        bool isAvailable;
        uint256 price;
    }

    mapping(uint256 => Room) public rooms;
    Reservation[] public reservations;

    event ReservationMade(uint256 reservationId, address guest, uint256 roomId, uint256 startDate, uint256 endDate);
    event PaymentMade(uint256 reservationId, address guest, uint256 amount);
    event ReservationCancelled(uint256 reservationId, address guest);
    event FundsWithdrawn(address recipient, uint256 amount);
    event GuestRefunded(uint256 reservationId, address guest, uint256 refundAmount);

    modifier roomExists(uint256 roomId) {
        require(rooms[roomId].isAvailable, "Room already booked or does not exist");
        _;
    }

    modifier roomAvailable(uint256 roomId, uint256 startDate, uint256 endDate) {
        require(rooms[roomId].isAvailable, "Room is not available");
        require(isRoomAvailable(roomId, startDate, endDate), "Room is already booked for the selected dates");
        _;
    }

    constructor(uint256[] memory roomIds, uint256[] memory roomPrices) {
        require(roomIds.length == roomPrices.length, "Invalid input lengths");
        owner = msg.sender;

        for (uint256 i = 0; i < roomIds.length; i++) {
            rooms[roomIds[i]] = Room(true, roomPrices[i]);
        }
    }

    function makeReservation(uint256 roomId, uint256 startDate, uint256 endDate)
        public
        roomExists(roomId)
        roomAvailable(roomId, startDate, endDate)
    {
        require(endDate > startDate, "End date should be greater than start date");

        Reservation memory reservation = Reservation(msg.sender, roomId, startDate, endDate, false);
        reservations.push(reservation);

        for (uint256 i = startDate; i <= endDate; i++) {
            rooms[roomId].isAvailable = false;
        }

        emit ReservationMade(reservations.length - 1, msg.sender, roomId, startDate, endDate);
    }

    function makePayment(uint256 reservationId, uint256 amount) public payable {
        require(reservationId < reservations.length, "Invalid reservation ID");

        Reservation storage reservation = reservations[reservationId];

        require(!reservation.isPaid, "Payment has already been made");
        require(msg.sender == reservation.guest, "Only the guest can make the payment");
        require(msg.value >= amount, "Insufficient payment amount");

        reservation.isPaid = true;

        emit PaymentMade(reservationId, msg.sender, amount);
    }


    function cancelReservation(uint256 reservationId) public {
        require(reservationId < reservations.length, "Invalid reservation ID");

        Reservation storage reservation = reservations[reservationId];

        require(!reservation.isPaid, "Payment has already been made");
        require(msg.sender == reservation.guest, "Only the guest can cancel the reservation");

        for (uint256 i = reservation.startDate; i <= reservation.endDate; i++) {
            rooms[reservation.roomId].isAvailable = true;
        }

        emit ReservationCancelled(reservationId, msg.sender);
    }

    

    function refundGuest(uint256 reservationId) public {
        require(reservationId < reservations.length, "Invalid reservation ID");

        Reservation storage reservation = reservations[reservationId];

        require(reservation.isPaid, "Payment has not been made for this reservation");
        require(msg.sender == owner, "Only the contract owner can refund guests");

        address payable guest = payable(reservation.guest);
        uint256 refundAmount = calculateRefundAmount(reservation.startDate, reservation.endDate, rooms[reservation.roomId].price);

        require(address(this).balance >= refundAmount, "Insufficient contract balance for refund");

        reservation.isPaid = false;

        guest.transfer(refundAmount);

        emit GuestRefunded(reservationId, guest, refundAmount);
    }

    function calculateRefundAmount(uint256 startDate, uint256 endDate, uint256 pricePerNight) private pure returns (uint256) {
        uint256 totalNights = endDate - startDate + 1;
        return totalNights * pricePerNight;
    }


    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdrawFunds(uint256 amount) public {
        require(amount <= address(this).balance, "Insufficient contract balance");
        require(msg.sender == owner, "Only the contract owner can withdraw funds");

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Failed to withdraw funds");

        emit FundsWithdrawn(msg.sender, amount);
    }


    function isRoomAvailable(uint256 roomId, uint256 startDate, uint256 endDate) private view returns (bool) {
        for (uint256 i = startDate; i <= endDate; i++) {
            if (!rooms[roomId].isAvailable) {
                return false;
            }
        }
        return true;
    }

    function calculateTotalPrice(uint256 startDate, uint256 endDate, uint256 pricePerNight) private pure returns (uint256) {
        uint256 totalNights = endDate - startDate + 1;
        return totalNights * pricePerNight;
    }

    function reservationCount() public view returns (uint256) {
    return reservations.length;
    }
}
