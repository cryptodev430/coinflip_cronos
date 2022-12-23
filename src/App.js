import React, { useState, useEffect } from "react";
import { ethers, BigNumber, Signer } from "ethers";
import MetamaskLogo from "./assets/coin.png";
import Coin from "./components/Coin/Coin";
import { ContractAddress, ContractABI } from "./ContractABI";
import { SpinnerCircular } from "spinners-react";
import * as walletDefiwallet from "./helper/wallet-defiwallet.ts";
import * as walletMetamask from "./helper/wallet-metamask.ts";
import * as utils from "./helper/utils.ts";
import "./modal.css";
const a = {
  value: 13,
  text: "10",
};

const options = [
  {
    value: 10.3,
    text: "10",
  },
  {
    value: 56.5,
    text: "50",
  },
  {
    value: 103,
    text: "100",
  },
  {
    value: 206,
    text: "200",
  },
  {
    value: 309,
    text: "300",
  },
];

const FEE = 3;

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState();
  const [count, setCount] = useState(10.3);
  const [coin, setCoin] = useState("head");
  const [side, setSide] = useState("head");
  const [flipping, setFlipping] = useState(false);
  const [amount, setAmount] = useState();
  const [eventHistory, setEventHistory] = useState([]);
  const [spin, setSpin] = useState(false);
  const [claimSpin, setClaimSpin] = useState(false);
  const [provider, setProvider] = useState();
  const [contractInstance, setContractInstance] = useState();
  const [isShowModal, setShowModal] = useState();
  const [balance, setBlance] = useState();

  useEffect(() => {
    const addEventLog = async (newEvent) => {
      console.log("eventHistory: before push", eventHistory);
      let eventTmp = Array.from(eventHistory);
      eventTmp.push(newEvent);
      console.log("eventTmp: after push", eventTmp);
      setEventHistory(eventTmp);
    };

    const betEvent = async (bettor, status, betAmount, timeStamp) => {
      // let newEvent = { bettor, status, betAmount, timeStamp };
      // await addEventLog(newEvent);

      await fetch();
    };

    if (contractInstance) {
      // const signer = provider.getSigner();
      // const contract = new ethers.Contract(
      //   ContractAddress,
      //   ContractABI,
      //   signer
      // );
      console.log("eventHistory: on", eventHistory);
      console.log("contract.on", contractInstance);
      contractInstance.on("betCompleted", betEvent);
    }
  }, [eventHistory, contractInstance]);

  useEffect(() => {
    const setInitial = async () => {
      let userAmount = await contractInstance.users(userInfo);
      setAmount(parseInt(userAmount.unclaimed));
    };

    if (userInfo && contractInstance) {
      setInitial();
    }
  }, [userInfo, contractInstance]);

  useEffect(() => {
    const initializeContract = async () => {
      const coinFlipWriteContractInstance =
        await utils.getWriteContractInstance(provider);
      setContractInstance(coinFlipWriteContractInstance);
    };
    if (provider) {
      initializeContract();
    }
  }, [provider]);

  useEffect(() => {
    if (provider) {
      updateBalance();
    }
  }, [provider]);

  useEffect(() => {
    const fetch = async () => {
      // const userData = JSON.parse(localStorage.getItem('userAccount'));
      let eventTmp = [];
      // let web3 = new Web3(serverProvider);
      // console.log("web3", web3);

      try {
        // let myContract = new web3.eth.Contract(
        //   CoinFlipJson.abi,
        //   configVars.coinFlip.address
        // );
        // console.log("myContract", myContract);

        // myContract.betCompleted({}, { fromBlock: 6675780, toBlock: 'latest' }).get((error, eventResult) => {
        //   if (error)
        //     console.log('Error in myEvent event handler: ' + error);
        //   else
        //     console.log('myEvent: ' + JSON.stringify(eventResult.args));
        // });

        // myContract
        //   .getPastEvents('allEvents', function (error, events) {
        //     console.log(error);
        //   })
        //   .then(function (events) {
        //     console.log(events); // same results as the optional callback above
        //   })

        // const contract = new ethers.Contract(ContractAddress, ContractABI, signer);
        const eventFilter = contractInstance.filters.betCompleted();

        let startBlock = 6689792;
        let endBlock = await provider.getBlockNumber();
        let allEvents = [];
        for (let i = startBlock; i < endBlock; i += 2000) {
          const _startBlock = i;
          const _endBlock = Math.min(endBlock, i + 1999);
          let events = await contractInstance.queryFilter(
            eventFilter,
            _startBlock,
            _endBlock
          );
          allEvents = [...allEvents, ...events];
        }
        console.log("allEvents", allEvents)
        // eventFilter.fromBlock = await provider
        //   .getBlockNumber()
        //   .then((b) => b - 10000);
        // eventFilter.toBlock = "latest";
        // console.log("eventFilter", eventFilter);
        // // const transaction = coinFlipWriteContractInstance.getDeployTransaction();

        // // console.log("tranasacti: fetch", transaction);
        // // const factory = new ethers.ContractFactory(CoinFlipJson.abi, CoinFlipJson.bytecode, signer);

        // // console.log("factory: fetch", factory);

        // // const number = coinFlipWriteContractInstance.deployTransaction.blockNumber;

        // console.log("instance: fetch", coinFlipWriteContractInstance);
        // const events = await contractInstance.queryFilter(eventFilter);
        

        if (allEvents.length > 10) {
          for (let index = allEvents.length - 1; index > allEvents.length - 11; index--) {
            eventTmp.push({
              bettor: allEvents[index].args[0],
              status: allEvents[index].args[1],
              betAmount: allEvents[index].args[2],
              timeStamp: allEvents[index].args[3],
            });
          }
          setEventHistory(eventTmp);
        } else {
          for (let index = allEvents.length - 1; index >= 0; index--) {
            eventTmp.push({
              bettor: allEvents[index].args[0],
              status: allEvents[index].args[1],
              betAmount: allEvents[index].args[2],
              timeStamp: allEvents[index].args[3],
            });
          }
          setEventHistory(eventTmp);
        }
      } catch (error) {
        console.log("Contract Error!");
      }
      return eventTmp;
    };

    if (contractInstance) {
      fetch();
    }
  }, [contractInstance]);

  const handleShowModal = () => {
    setShowModal(!isShowModal);
  };

  const handleDisconnect = async () => {
    setIsConnected(false);
  };

  const updateBalance = async () => {
    let signer = provider.getSigner();
    let balance = ethers.utils.formatEther(await signer.getBalance());
    setBlance(Number(balance).toFixed(1));
  };

  const Modal = ({ handleClose, show, children }) => {
    const showHideClassName = show
      ? "modal display-block"
      : "modal display-none";

    return (
      <div className={showHideClassName}>
        <section className="modal-main">
          {children}
          <div style={{ display: "flex", justifyContent: "end" }}>
            <button type="button" onClick={handleClose}>
              Close
            </button>
          </div>
        </section>
      </div>
    );
  };

  const connectWalletPressed = async (option) => {
    let walletStatus;

    switch (option) {
      // Wallet injected within browser (MetaMask)
      case "metamask-injected":
        walletStatus = await walletMetamask.connect();
        break;
      // Crypto.com DeFi Wallet Extension (browser)
      case "defiwallet":
        walletStatus = await walletDefiwallet.connect();
        break;
      // Crypto.com DeFi Wallet mobile app (via Wallet Connect)

      default:
        walletStatus = await walletMetamask.connect();
    }

    if (walletStatus.address) {
      setProvider(walletStatus.browserWeb3Provider);
      setIsConnected(true);
      setUserInfo(walletStatus.address);
      console.log(walletStatus.browserWeb3Provider);
    } else {
      setUserInfo("");
    }
    setShowModal(false);
  };

  const bettingHandle = async () => {
    setSpin(true);

    try {
      // const signer = provider.getSigner();

      // const contract = new ethers.Contract(ContractAddress, ContractABI, provider);
      // const contractSigner = contract.connect(signer);
      const time = Date.now();
      let gasPrice = await provider.getGasPrice();

      gasPrice.mul(2);

      const transaction = await contractInstance["placeBet"]("true", time, {
        value: ethers.utils.parseUnits(count.toString(), 18),
      });
      //sends 0.1 eth
      const res = await transaction.wait();
      console.log("res: bettingHandle", res);

      if (res.events[0].args[1]) {
        if (coin === "head") {
          setSide("head");
        } else {
          setSide("tail");
        }
      } else {
        if (coin === "head") {
          setSide("tail");
        } else {
          setSide("head");
        }
      }
      setSpin(false);
      setFlipping(true);
      setTimeout(() => setFlipping(false), 1000);

      let userAmount = await contractInstance.users(userInfo);
      console.log("userAmount", userAmount);
      setAmount(parseInt(userAmount.unclaimed));
      updateBalance();
    } catch (error) {
      setSpin(false);
      console.log(error);
      alert("Betting Failed!");
    }
  };

  const claimHandle = async () => {
    setClaimSpin(true);

    try {
      let tx = await contractInstance.claimRewards();
      tx = await tx.wait();

      setClaimSpin(false);
      setAmount(0);
      alert("You earned rewards!");
      updateBalance();
    } catch (error) {
      setClaimSpin(false);
      alert("Claim failed!");
    }
  };

  const relativeTime = (oldTimestamp) => {
    const seconds = Date.now();
    const difference = Math.floor((seconds - parseInt(oldTimestamp)) / 1000);
    let output = ``;
    if (difference < 60) {
      // Less than a minute has passed:
      output = `${difference} seconds ago`;
    } else if (difference < 3600) {
      // Less than an hour has passed:
      output = `${Math.floor(difference / 60)} minutes ago`;
    } else if (difference < 86400) {
      // Less than a day has passed:
      output = `${Math.floor(difference / 3600)} hours ago`;
    } else if (difference < 2620800) {
      // Less than a month has passed:
      output = `${Math.floor(difference / 86400)} days ago`;
    } else if (difference < 31449600) {
      // Less than a year has passed:
      output = `${Math.floor(difference / 2620800)} months ago`;
    } else {
      // More than a year has passed:
      output = `${Math.floor(difference / 31449600)} years ago`;
    }
    return output;
  };

  return (
    <div className="app">
      <header className="w-full">
        {isConnected && (
          <div className="flex flex-col justify-center items-end">
            <div className="text-center">
              <button
                className="app-buttons__logout bg-gray-200"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
              <p>
                {userInfo?.slice(0, 4)}...{userInfo?.slice(38)}
              </p>
              <p>{`Balance: ${balance} CRO`}</p>
            </div>
          </div>
        )}
      </header>
      <div className="app-wrapper">
        <Modal show={isShowModal} handleClose={handleShowModal}>
          <div>
            <button
              className="app-buttons__login"
              onClick={() => connectWalletPressed("defiwallet")}
            >
              Connect to Defi Wallet
            </button>
            <button
              className="app-buttons__login"
              onClick={() => connectWalletPressed("metamask-injected")}
            >
              Connect to Metamask
            </button>
          </div>
        </Modal>

        {!isConnected && (
          <div>
            <img src={MetamaskLogo} alt="meta mask logo" />
            <button className="app-buttons__login" onClick={handleShowModal}>
              Connect to wallet
            </button>
          </div>
        )}
      </div>
      {isConnected && (
        <div>
          <div className="mb-5">
            <Coin side={side} flipping={flipping} />
          </div>
          <div className="app-wrapperrounded-3xl bg-white rounded-3xl border-black border-2">
            <div className="flex gap-4 bg-[#2a74ca] rounded-t-3xl p-3">
              <div className="flex items-center bg-gradient-to-r from-[#fea800] to-[#fb6000] via-yellow-500 rounded-l-full px-2.5">
                {options.map((item, key) => {
                  return (
                    <label className="mr-2.5" key={key}>
                      <input
                        type="radio"
                        name="betcount"
                        value={item.value}
                        // checked={count === item.value}
                        onChange={(e) => {
                          setCount(e.target.value);
                        }}
                      />
                      {item.text}
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center bg-gradient-to-r from-[#fea800] to-[#fb6000] via-yellow-500 px-2.5">
                <input
                  className="mr-2.5"
                  type="radio"
                  name="coin"
                  value="head"
                  checked={coin === "head"}
                  onChange={(e) => {
                    setCoin(e.target.value);
                  }}
                />
                HEAD
                <input
                  className="mx-2.5"
                  type="radio"
                  name="coin"
                  value="tail"
                  checked={coin === "tail"}
                  onChange={(e) => {
                    setCoin(e.target.value);
                  }}
                />
                TAIL
              </div>
              <button
                type="button"
                className="w-28 rounded-none bg-gradient-to-r from-[#fea800] to-[#fb6000] via-yellow-500 text-center mx-auto"
                onClick={(e) => bettingHandle()}
              >
                {spin ? (
                  <SpinnerCircular
                    className="mx-auto"
                    size="24"
                    enabled={spin}
                  />
                ) : (
                  "Betting"
                )}
              </button>
              {amount > 0 ? (
                <button
                  type="button"
                  className="w-28 rounded-r-full rounded-l-none bg-gradient-to-r from-[#fea800] to-[#fb6000] via-yellow-500"
                  onClick={(e) => claimHandle()}
                >
                  {claimSpin ? (
                    <SpinnerCircular
                      className="mx-auto"
                      size="24"
                      enabled={claimSpin}
                    />
                  ) : (
                    "Claim"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-r-full rounded-l-none bg-slate-100"
                  disabled
                >
                  Claim
                </button>
              )}
            </div>
            <div className="p-3 w-full">
              <h1 className="font-bold text-xl border-b-2 border-black text-center">
                Recent Plays
              </h1>
              <table className="table-auto w-full">
                <tbody>
                  {eventHistory.length > 0 &&
                    eventHistory.map((item, index) => (
                      <tr className="border-b-2 border-black" key={index}>
                        <td className="p-2">{`${item.bettor.slice(
                          0,
                          4
                        )}...${item.bettor.slice(38)}`}</td>
                        <td className="p-2 italic text-[#fb600]">flipped</td>
                        <td className="p-2">
                          {ethers.utils.formatEther(
                            BigNumber.from(item.betAmount)
                          )}
                        </td>
                        <td className="p-2 italic text-[#fb600]">
                          {item.status ? "Won" : "Lost"}
                        </td>
                        <td className="p-2 italic text-[#fb600]">
                          {relativeTime(item.timeStamp)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
