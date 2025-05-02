// src/axios.js
import axios from "axios";

// after
const instance = axios.create({
    baseURL: "http://localhost:8000",   // <-- your FastAPI port
  });
  
export default instance;
