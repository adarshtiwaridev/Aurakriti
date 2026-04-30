"use client";

import { Provider } from "react-redux";
import {store} from "../redux/store";
import Navbar from "./ecommerce/Navbar";
export default function ClientProvider({ children }) {
  return (
    <Provider store={store}>
      <Navbar />
      {children}
    </Provider>
  );
}