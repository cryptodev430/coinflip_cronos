import React from "react";
import "./Coin.css";
import CoinTura from "../../assets/coin-head.gif";
import CoinYazi from "../../assets/coin-tail.gif";

const Coin = (props) => {
  return (
    <div className="Coin-container" >
      <div className={`Coin ${props.flipping ? "Coin-rotate" : ""}`}>
        <img
          src={CoinTura}
          className={props.side === "tail" ? "Coin-back" : "Coin-front"}
          alt="head"
        />
        <img
          src={CoinYazi}
          className={props.side === "tail" ? "Coin-front" : "Coin-back"}
          alt="tail"
        />
      </div>
    </div>
  );
};

export default Coin;