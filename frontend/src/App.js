import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loadUser } from "./features/auth/authSlice";
import { setAuthToken } from "./utils/setAuthToken";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Alert from "./components/layout/Alert";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CharacterCreator from "./pages/CharacterCreator";
import CharacterDetail from "./pages/CharacterDetail";
import CharacterChat from "./pages/CharacterChat";
import MerchandiseStore from "./pages/MerchandiseStore";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CreateMerchandise from "./pages/CreateMerchandise";
import PrivateRoute from "./components/routing/PrivateRoute";
import NotFound from "./pages/NotFound";

// Check for token in localStorage
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <>
      <Header />
      <main className="container">
        <Alert />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={<PrivateRoute component={Dashboard} />}
          />
          <Route
            path="/create-character"
            element={<PrivateRoute component={CharacterCreator} />}
          />
          <Route path="/characters/:id" element={<CharacterDetail />} />
          <Route
            path="/characters/:id/chat"
            element={<PrivateRoute component={CharacterChat} />}
          />
          <Route
            path="/characters/:id/create-merchandise"
            element={<PrivateRoute component={CreateMerchandise} />}
          />
          <Route path="/merchandise" element={<MerchandiseStore />} />
          <Route path="/merchandise/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<PrivateRoute component={Cart} />} />
          <Route
            path="/checkout"
            element={<PrivateRoute component={Checkout} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default App;
