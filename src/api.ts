import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const API_BASE_URL = process.env.BACKEND_URL;

console.log("API_BASE_URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
