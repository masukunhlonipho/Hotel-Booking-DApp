import React, { useState, useEffect } from "react";
import HotelBooking from "./contracts/HotelBooking.json";
import getWeb3 from "./getWeb3.js";
import "./App.css";

function App() {
  const [roomId, setRoomId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [defaultAccount, setDefaultAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [balance, setBalance] = useState(0);
  const [reservationCount, setReservationCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        // Get network provider and web3 instance
        const web3 = await getWeb3();

        // Get the contract instance
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = HotelBooking.networks[networkId];
        const contract = new web3.eth.Contract(
          HotelBooking.abi,
          //deployedNetwork && deployedNetwork.address
          //0x354b247ee8e16701c7d3658df22c7762f8f961ca
          0x14919268E9115A99fD01E6ad67E857fff0f592d8
        );
        
        setContract(contract);

        // Get the user accounts
        const accounts = await web3.eth.getAccounts();
        setDefaultAccount(accounts[0]);

        // Check if the account is the manager/owner
        const manager = await contract.methods.owner().call();
        setIsManager(manager === accounts[0]);

        // Get the contract balance
        const contractBalance = await web3.eth.getBalance(deployedNetwork.address);
        setBalance(web3.utils.fromWei(contractBalance, "ether"));

        // Get the reservation count
        const count = await contract.methods.reservationCount().call();
        setReservationCount(count);
      } catch (error) {
        console.error("Error initializing web3:", error);
      }
    };

    init();
  }, []);

 const makeReservation = async () => {
  if (!contract) return;

  try {
    if (!roomId || !startDate || !endDate) {
      throw new Error("Please provide valid inputs for making a reservation.");
    }

    await contract.methods.makeReservation(roomId, startDate, endDate).send({ from: defaultAccount });
    const count = await contract.methods.reservationCount().call();
    setReservationCount(count);
  } catch (error) {
    console.error("Error making reservation:", error);
    alert("Error making reservation: " + error.message);
  }
};

const makePayment = async () => {
  if (!contract) return;

  try {
    if (!reservationId || !paymentAmount) {
      throw new Error("Please provide valid inputs for making a payment.");
    }

    await contract.methods.makePayment(reservationId, paymentAmount).send({ from: defaultAccount, value: paymentAmount });
  } catch (error) {
    console.error("Error making payment:", error);
    alert("Error making payment: " + error.message);
  }
};

const cancelReservation = async () => {
  if (!contract) return;

  try {
    if (!reservationId) {
      throw new Error("Please provide a valid reservation ID for cancelling a reservation.");
    }

    await contract.methods.cancelReservation(reservationId).send({ from: defaultAccount });
    const count = await contract.methods.reservationCount().call();
    setReservationCount(count);
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    alert("Error cancelling reservation: " + error.message);
  }
};


 const refundGuest = async () => {
  if (!contract) return;

  try {
    if (!isManager) {
      throw new Error("You are not authorized to refund guests.");
    }

    await contract.methods.refundGuest(reservationId).send({ from: defaultAccount });
  } catch (error) {
    console.error("Error refunding guest:", error);
    alert("Error refunding guest: " + error.message);
  }
};

const withdrawFunds = async () => {
  if (!contract) return;

  try {
    if (!isManager) {
      throw new Error("You are not authorized to withdraw funds.");
    }

    await contract.methods.withdrawFunds(balance).send({ from: defaultAccount });
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    alert("Error withdrawing funds: " + error.message);
  }
};

const getContractBalance = async () => {
  if (!contract) return;

  try {
    if (!isManager) {
      throw new Error("You are not authorized to get the contract balance.");
    }

    const contractBalance = await contract.methods.getBalance().call();
    setBalance(contractBalance);
  } catch (error) {
    console.error("Error getting contract balance:", error);
    alert("Error getting contract balance: " + error.message);
  }
};

  

  
  const getReservationCount = async () => {
    if (!contract) return;

    try {
      const count = await contract.methods.reservationCount().call();
      setReservationCount(count);
    } catch (error) {
      console.error("Error getting reservation count:", error);
    }
  };
 
  return (
    <div>
<h1>MASUKU HOTEL BOOKINGS</h1>

      <div>
      <h2>MANAGER</h2>
      {isManager ? (
        <>
          <button onClick={refundGuest}>Refund Guest</button>
          <button onClick={withdrawFunds}>Withdraw Funds</button>
          <button onClick={getContractBalance}>Get Contract Balance</button>
        </>
      ) : (
        <p1>You are not authorized to perform manager's actions.</p1>
      )}
    </div>

    <h2>GUESTS</h2>
    <button onClick={getReservationCount}>Get Reservation Count</button>
    <p>Reservation Count: {reservationCount}</p>

    <div>
      <h4>Make Reservation</h4>
      <input
        type="number"
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <input
        type="date"
        placeholder="Start Date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <input
        type="date"
        placeholder="End Date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
      <button onClick={makeReservation}>Make Reservation</button>
    </div>

    <div>
      <h4>Make Payment</h4>
      <input
        type="number"
        placeholder="Reservation ID"
        value={reservationId}
        onChange={(e) => setReservationId(e.target.value)}
      />
      <input
        type="number"
        placeholder="Payment Amount"
        value={paymentAmount}
        onChange={(e) => setPaymentAmount(e.target.value)}
      />
      <button onClick={makePayment}>Make Payment</button>
    </div>

    <div>
      <h4>Cancel Reservation</h4>
      <input
        type="number"
        placeholder="Reservation ID"
        value={reservationId}
        onChange={(e) => setReservationId(e.target.value)}
      />
      <button onClick={cancelReservation}>Cancel Reservation</button>
    </div>
  </div>
);
}

export default App;

