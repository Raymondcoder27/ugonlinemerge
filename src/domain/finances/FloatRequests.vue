<script setup lang="ts">
import { useBilling } from "@/domain/finances/stores";
import { onMounted, ref, reactive, watch, computed, type Ref } from "vue";
import { useDebounceFn } from "@vueuse/core";
import type { IGoFilter } from "@/types";
// import { request } from "http";
// import { useDebounce } from "@vueuse/core";
import moment from "moment/moment";
import { useBalance } from "@/domain/balance/stores";

const balanceStore = useBalance();

const billingStore = useBilling();
const page = ref(1);
const loading: Ref<boolean> = ref(false);
const limit = ref(10);
const floatRequests: Ref<any[]> = ref([]);
const totalRecords = computed(() => billingStore.floatRequests.length); // Total floatRequests
const totalPages = computed(() => Math.ceil(totalRecords.value / limit.value));
const pageInput = ref(1);
const changePageSize = () => {
  page.value = 1;
  fetchFloatRequests();
};
const jumpToPage = () => {
  if (pageInput.value > totalPages.value) {
    page.value = totalPages.value;
  } else if (pageInput.value < 1) {
    page.value = 1;
  } else {
    page.value = pageInput.value;
  }
  fetchFloatRequests();
};
function fetchFloatRequests() {
  // branchStore
  //   .fetchFloatRequests(page.value, limit.value)
  //   .then(() => (loading.value = false))
  //   .catch((error: ApiError) => {
  //     loading.value = false;
  //     notify.error(error.response.data.message);
  //   });

  loading.value = true;
  // Fetch the services based on the page and limit
  const startIndex = (page.value - 1) * limit.value;
  const endIndex = startIndex + limit.value;
  floatRequests.value = billingStore.floatRequests.slice(startIndex, endIndex);
  loading.value = false;
}
const paginatedFloatRequests = computed(() => {
  const start = (page.value - 1) * limit.value;
  const end = start + limit.value;
  return billingStore.floatRequests.slice(start, end); // Adjust according to your page & limit
});

const filter: IGoFilter = reactive({
  limit: 100,
  offset: 0,
  page: 0,
  sort: [
    {
      field: "firstname",
      order: "ASC",
    },
  ],
  filter: [
    {
      field: "firstname",
      operand: "",
      operator: "CONTAINS",
    },
    {
      field: "username",
      operand: "",
      operator: "CONTAINS",
    },
    {
      field: "phone",
      operand: "",
      operator: "CONTAINS",
    },
  ],
});

const next = () => {
  if (billingStore.floatRequests.length >= billingStore.limit) {
    page.value += 1;
    billingStore.fetchFloatRequests();
  }
};

const previous = () => {
  if (page.value > 1) {
    page.value -= 1;
    billingStore.fetchFloatRequests();
  }
};

// Debounced filter update function
const updateFilter = useDebounceFn(
  () => {
    fetchFloatRequests();
  },
  300,
  { maxWait: 5000 }
);

// Watch for changes in the filter object
watch(
  () => filter,
  () => updateFilter(),
  { deep: true }
);

function convertDateTime(date: string) {
  return moment(date).format("DD-MM-YYYY HH:mm:ss");
}

// function submit() {
//   const payload = {
//     amount: form.amount,
//     branchId: form.branchId,
//   };
  
//   console.log("Submitting payload:", payload);

//   loading.value = true;
//   store.allocateFloat(payload) // API call to allocate float
//     // .then(() => {
//       billingStore.adjustFloatLedger(payload); // Adjust ledger
//       balanceStore.decreaseTotalBalance(payload.amount); // Update balance
//       // notify.success(`Float allocated to branch: ${form.branchId}`);
//       notify.success(`Float allocated to ${form.branchId}`);
//       emit("floatAllocated");
//     // })
//     // .catch((err) => {
//       // console.error("Error allocating float:", err);
//       // notify.error("Failed to allocate float.");
//     // })
//     // .finally(() => {
//       // loading.value = false;
//     // });
// }

    // const floatRequestsFromLocalStorage = JSON.parse(localStorage.getItem('floatRequestToBranchManagerLocalStorage') || '[]');

    // if (floatRequestsFromLocalStorage) {
    //   floatRequestsFromLocalStorage.value = floatRequestsFromLocalStorage;
    // }

// pass in the requestId
const approveFloatRequest = (requestId: any) => {
  billingStore.approveFloatRequest(requestId);
  // billingStore.fetchFloatRequests();
  balanceStore.approveFloatRequest(requestId);
  billingStore.reduceFloatLedger(requestId); 
  billingStore.allocateFloatFromRequest(requestId);
  console.log(`float request with id ${requestId} approved`);
};

const rejectFloatRequest = (requestId: any) => {
  billingStore.rejectFloatRequest(requestId);
  billingStore.fetchFloatRequests();
  console.log(`float request with id ${requestId} rejected`);
};

onMounted(() => {
  billingStore.fetchFloatRequests();
});
</script>

<template>
  <div class="w-full shadow-lg bg-white rounded p-2 h-full flex flex-col">
    <div class="flex space-x-2 my-1 pt-1 pb-3">
      <div class="flex-grow">
        <div class="grid grid-cols-5 gap-2 bg-gray-10 border border-gray-200 rounded px-2 py-3">
            <select v-if="filter.filter !== undefined" input-type="text" v-model="filter.filter[2].operand"
            class="filter-element e-input" type="text" placeholder="Search by Service">
            <option value="" disabled selected>Filter by Branch</option>
            <option value="Branch 1">Branch 1</option>
            <option value="Branch 2">Branch 2</option>
            <option value="Branch 3">Branch 3</option>
          </select>
          <select v-if="filter.filter !== undefined" input-type="text" v-model="filter.filter[2].operand"
            class="filter-element e-input" type="text" placeholder="Drop down provider">
            <option value="" disabled selected>Filter by Amount</option>
            <option value="NIRA"> &lt 10,000,000 </option>
            <option value="URSB"> &lt 10,000,000 >= </option>
            <!-- <option value="UMEME">UMEME</option> -->
            <option value="NARO"> > 10,000,000 </option>
          </select>
          <select v-if="filter.filter !== undefined" input-type="text" v-model="filter.filter[1].operand"
            class="filter-element e-input" type="text" placeholder="Filter by Status">
            <option value="" disabled selected>Filter by Status</option>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">APPROVED</option>
            <option value="BLOCKED">REJECTED</option>
          </select>
          <div class="flex items-center">
            <label for="date-from" class="mr-2 text-sm text-gray-600"
              >From:</label
            >
            <input
              type="date"
              id="date-from"
              class="e-input filter-element"
              v-model="filter.fromDate"
            />
          </div>
          <div class="flex items-center">
            <label for="date-to" class="mr-2 text-sm text-gray-600">To:</label>
            <input
              type="date"
              id="date-to"
              class="e-input filter-element"
              v-model="filter.toDate"
            />
          </div>
        </div>
        
      </div>
    </div>
    <div class="flex my-1">
      <table class="table">
        <thead>
          <tr class="header-tr">
            <th class="text-left">#</th>
            <th class="text-left">Date</th>
            <!-- <th class="text-left">Name</th> -->
            <th class="text-left">Branch</th>
            <th class="text-left">Amount</th>
            <th class="text-left">Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- <tr
            class="text-right"
            v-for="(request, id) in store.floatRequests"
            :key="id"
          > -->
          <!-- <tr
            class="text-right"
            v-for="(request, id) in paginatedFloatRequests"
            :key="id"
          > -->
          <tr
            class="text-left"
            v-for="(request, id) in paginatedFloatRequests"
            :key="id"
          >
            <td>{{ id + 1 }}</td>
            <!-- <td class="text-left">{{  convertDateTime(request.date) }}</td> -->
            <td class="text-left">{{ request.requestDate }}</td>
            <!-- convertDateTime(request.createdAt) -->
            <td class="text-left">{{ request.branch }}</td>
            <td class="text-left">{{ request.amount.toLocaleString() }}</td>
            <td class="text-left"><!-- First Case: float request approved -->
              <div v-if="request.status === 'approved'">
                <!-- <td> -->
                <!-- <label> -->
                <!-- <span
                  class="text-xs cursor-pointer rounded-md px-1 py-0.5 font-semibold text-green-700 bg-green-100 border border-green-300 hover:text-green-700 hover:bg-green-200"
                  @click="approveFloatRequest(request.id)"
                  >
                  <i class="fa-solid fa-check"></i>
                  Approved</span
                > -->
                <span
                  class="text-xs cursor-pointer rounded-md px-1 py-0.5 font-semibold text-green-700 bg-green-100 border border-green-300 hover:text-green-700 hover:bg-green-200"
                  @click="approveFloatRequest(request.id)"
                  >
                  <!-- <i class="fa-solid fa-check"></i> -->
                  Approved</span
                >
                <!-- </label> -->
                <!-- </td> -->
              </div>

              <!-- Second Case: Manager directly assigned to branch -->
              <div v-else-if="request.status === 'rejected'">
                <!-- <td> -->
                <label>
                  <span
                    class="text-xs cursor-pointer rounded-md px-1 py-0.5 font-semibold text-red-700 bg-red-200 border border-red-300 hover:text-red-700 hover:bg-red-200"
                    @click="open(request)"
                    >
                  <!-- <i class="fa-solid fa-times-square"></i> -->
                  Rejected</span
                  >
                </label>
                <!-- </td> -->
              </div>
              <div v-else>
                <!-- <td> -->
                <label>
                  <span
                    class="text-xs cursor-pointer rounded-md px-1 py-0.5 font-semibold text-gray-700 bg-gray-50 border border-gray-300 hover:text-gray-700 hover:bg-red-200"
                    @click="open(request)"
                    >
                  <!-- <i class="fa-solid fa-clock text-gray-500"></i> -->
                  Pending</span
                  >
                </label>
                <!-- </td> -->
              </div>
            </td>
            <td class="text-right">
              <!-- First Case: float request approved -->
              <div v-if="request.status === 'approved'">
                <!-- <td> -->
                <!-- <label> -->
                <span
                  class="text-xs cursor-pointer rounded-md px-1 py-0.5 font-semibold text-white bg-blue-600 hover:text-white hover:bg-blue-700"
                  @click="approveFloatRequest(request.id)"
                  >
                  <!-- <i class="fa-solid fa-check"></i>
                  Approved</span
                > -->
                  <i class="fa-solid fa-eye"></i>
                  Details</span
                > 
                
                <!-- </label> -->
                <!-- </td> -->
              </div>

              <!-- Second Case: Manager directly assigned to branch -->
              <div v-else-if="request.status === 'rejected'">
                <!-- <td> -->
                <label>
                  <span
                    class="text-xs cursor-pointer rounded-md px-1 py-0.5 font-semibold text-white bg-blue-600 hover:text-white hover:bg-blue-700"
                    @click="open(request)"
                    >
                  <!-- <i class="fa-solid fa-times-square"></i>
                  Rejected</span
                  > -->
                  <i class="fa-solid fa-eye"></i>
                  Details</span
                  >
                  
                </label>
                <!-- </td> -->
              </div>

              <!-- Third Case: Fallback, no manager assigned -->
              <div v-else>
                <!-- <td> -->
                <span
                  class="text-xs rounded-md px-1 py-0.5 font-semibold text-white bg-blue-600 hover:text-white hover:bg-blue-800"
                  @click="approveFloatRequest(request.id)"
                  >
                  <i class="fa-solid fa-check"></i>
                  Approve</span
                >

                <span
                  class="text-xs rounded-md px-1 py-0.5 ml-1 font-semibold text-white bg-red-600 hover:text-white hover:bg-red-700"
                  @click="rejectFloatRequest(request.id)"
                  >
                  <i class="fa-solid fa-times-square"></i>
                  Reject</span
                >
                <!-- </td> -->
              </div>
            </td>

            <!-- <td class="text-center">
              <span class="text-xs rounded-md p-1 font-semibold text-blue-600 bg-blue-100 border border-blue-200 hover:text-blue-700 hover:bg-blue-200"
                @click="open(transaction)">Approve</span>

              <span class="text-xs rounded-md p-1 mr-2 ml-3 font-semibold text-red-600 bg-red-100 border border-red-200 hover:text-red-700 hover:bg-red-200"             
                @click="open(transaction)">Reject</span>
            </td> -->
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex text-xs mt-auto">
      <div class="w-full border-t border-b border-gray-50">
        <div class="flex gap-2 items-center">
          <!-- Previous Button -->
          <button
            class="px-1 py-0.5 text-red-600 rounded-md hover:bg-red-700 hover:text-white focus:outline-none focus:ring focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="{ 'opacity-50 cursor-not-allowed': page <= 1 }"
            :disabled="page <= 1"
            @click="previous"
          >
            <i class="fa-solid fa-arrow-left"></i>
          </button>

          <!-- Current Page / Total Pages -->
          <div class="py-1">
            <span class="px-2 py-1 bg-primary rounded text-white">{{
              page
            }}</span>
            <label class="mx-1 text-gray-400">/</label>
            <span class="px-2 py-1 bg-primary-50 rounded text-primary-600">
              {{ totalPages }}
            </span>
          </div>
          <button
            class="px-1 py-0.5 text-red-600 rounded-md hover:bg-red-700 hover:text-white focus:outline-none focus:ring focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="{
              'opacity-50 cursor-not-allowed': floatRequests.length < limit,
            }"
            :disabled="floatRequests.length < limit"
            @click="next"
          >
            <i class="fa-solid fa-arrow-right"></i>
          </button>

          <!-- Jump to Page -->
          <label>Page</label>
          <input
            type="number"
            placeholder="Page"
            class="form-element-lean bg-primary-50 font-bold text-center mx-1 w-12"
            v-model.number="pageInput"
            @change="jumpToPage"
          />

          <!-- Adjust Page Size -->
          <label>Page Size</label>
          <input
            type="number"
            placeholder="Page Size"
            class="form-element-lean bg-primary-50 font-bold text-center mx-1 w-12"
            v-model.number="limit"
            @change="changePageSize"
          />

          <!-- Total Records -->
          <span
            class="my-auto mx-2 bg-primary-50 px-3 py-1 rounded text-primary"
          >
            Total Records: {{ totalRecords }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/styles/forms.css";
@import "@/assets/styles/button.css";
@import "@/assets/styles/table.css";
@import "@/assets/styles/widgets.css";
</style>
