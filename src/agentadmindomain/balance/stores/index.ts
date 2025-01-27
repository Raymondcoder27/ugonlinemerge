import { defineStore } from "pinia";
import { reactive } from "vue";
// Pinia store
import { watchEffect } from "vue";
import {useBilling} from "@/agentadmindomain/finances/stores/index";



export interface TotalBalance {
  prevBalance: number;
  currentBalance: number;
}

export interface TotalAvailableFloat {
  prevAvailableFloat: number;
  currentAvailableFloat: number;
}

export interface TotalFinalFloat {
  prevFinalFloat: number;
  currentFinalFloat: number;
}

export const useBalance = defineStore("balance", () => {
  // Reactive state for total balance
  const totalBalance = reactive<TotalBalance>({
    prevBalance: 120000000, // Initial previous balance
    currentBalance: 120000000, // Initial current balance
  });

  const availableBalance = reactive<TotalBalance>({
    prevBalance: 300000000,
    currentBalance: 300000000,
  });

  const availableFloat = reactive<TotalAvailableFloat>({
    prevAvailableFloat: 300000000,
    currentAvailableFloat: 300000000,
  });

  const finalFloat = reactive<TotalFinalFloat>({
    prevFinalFloat: 300000000,
    currentFinalFloat: 300000000,
  });

  const billingStore = useBilling();

  watchEffect(() => {
    console.log("Total balance changed:", totalBalance);
  });

  // Simulate fetching the balance from an API
  // async function fetchTotalBalance() {
  //   // Simulate fetching data (replace with actual API call)
  //   const fetchedBalance = {
  //     prevBalance: totalBalance.current, // Setting previous balance to the current value
  //     currentBalance: 400000000, // Example of updating balance to a new value
  //   };
    
  //   // Update totalBalance reactive state
  //   totalBalance.prev = fetchedBalance.prev;
  //   totalBalance.current = fetchedBalance.current;
  // }


  // Increase the total balance and update "prev"
  function increaseTotalBalance(amount: number) {
    totalBalance.prevBalance = totalBalance.currentBalance;
    totalBalance.currentBalance += amount;
  }

  // Decrease the total balance and update "prev"
  function decreaseTotalBalance(amount: number) {
    totalBalance.prevBalance = totalBalance.currentBalance;
    totalBalance.currentBalance -= amount;
  }

  // pass in the requestId
// const approveFloatRequest = (requestId: any) => {
//   store.approveFloatRequest(requestId);
//   store.fetchFloatRequests();
//   console.log(`float request with id ${requestId} approved`);
// };

// const rejectFloatRequest = (requestId: any) => {
//   store.rejectFloatRequest(requestId);
//   store.fetchFloatRequests();
//   console.log(`float request with id ${requestId} rejected`);
// };

async function approveFloatRequest(requestId: any) {
  console.log("Approving float request with id:", requestId);
  // Simulate API call
  // const response = await fetch(`/api/float-requests/${requestId}/approve`, {
  //   method: "POST",
  // });
  // const data = await response.json();

  // use request in floatledgers array id to figure out amount 
  const floatRequest = billingStore.floatRequests.find(
    (request) => request.id === requestId
  );
  if (!floatRequest) {
    console.error("Float request not found");
    return;
  }
  // console.log("Float request approved:", data);
  totalBalance.prevBalance = totalBalance.currentBalance;
  // totalBalance.currentBalance -= floatRequest.amount; // Example of updating balance
  totalBalance.currentBalance -= floatRequest.amount;
}



    // Pinia Store (balance store)
async function fetchTotalBalance() {
  console.log("Fetching balance...");
  const fetchedBalance = {
    prevBalance: totalBalance.prevBalance, // Setting previous balance to the current value
    currentBalance: totalBalance.currentBalance, // Example of updating balance to a new value
  };

  console.log("Fetched balance:", fetchedBalance); // Debugging
  totalBalance.prevBalance = fetchedBalance.prevBalance;
  totalBalance.currentBalance = fetchedBalance.currentBalance;
  console.log("Updated balance in store:", totalBalance); // Debugging
}

async function fetchFinalFloatBalance() {
  console.log("Fetching final float")
  const fetchedBalance = {
    prevBalance: finalFloat.prevFinalFloat,
    currentBalance: finalFloat.currentFinalFloat,
  };

  console.log("Fetched Balance:", fetchedBalance)
  finalFloat.prevFinalFloat = fetchedBalance.prevBalance;
  finalFloat.currentFinalFloat = fetchedBalance.currentBalance;
  console.log("Updated balance in store: ", finalFloat)
}

  return {
    totalBalance,
    availableBalance,
    availableFloat,
    finalFloat,
    approveFloatRequest,
    fetchTotalBalance,
    fetchFinalFloatBalance,
    increaseTotalBalance,
    decreaseTotalBalance,
  };
});
