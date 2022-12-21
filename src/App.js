import React, { useState, useEffect } from 'react';
import { ethers, BigNumber, utils } from 'ethers';
import MetamaskLogo from './assets/coin.png';
import Coin from "./components/Coin/Coin";
import { ContractAddress, ContractABI } from './ContractABI';
import { SpinnerCircular } from 'spinners-react';
import * as walletDefiwallet from "./helper/wallet-defiwallet.ts";

const options = ["10", "50", "100", "200", "300" ];

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState();
  const [count, setCount] = useState('10');
  const [coin, setCoin] = useState('head');
  const [side, setSide] = useState('head');
  const [flipping, setFlipping] = useState(false)
  const [amount, setAmount] = useState()
  const [eventHistory, setEventHistory] = useState([]);
  const [spin, setSpin] = useState(false);
  const [claimSpin, setClaimSpin] = useState(false);
  const [provider, setProvider] = useState();

  useEffect(() =>  {

    const fetch = async () => {
      // const userData = JSON.parse(localStorage.getItem('userAccount'));
      let eventTmp = [];
      // let provider = new ethers.providers.JsonRpcProvider( "https://evm-t3.cronos.org" )
      console.log("events: fetch", provider);
      try {
        const contract = new ethers.Contract(ContractAddress, ContractABI, provider);
        const eventFilter = contract.filters.betCompleted()
        const events = await contract.queryFilter(eventFilter)
        events.reverse();
        if(events.length > 20) {
          for (let index = 0; index < 20; index++) {
            eventTmp.push({bettor:events[index].args[0], status:events[index].args[1], betAmount:events[index].args[2], timeStamp:events[index].args[3]});
          }
          setEventHistory(eventTmp)
        }
        else {
          for (let index = 0; index < events.length; index++) {
            eventTmp.push({bettor:events[index].args[0], status:events[index].args[1], betAmount:events[index].args[2], timeStamp:events[index].args[3]});
          }
          
          setEventHistory(eventTmp)
      }
      } catch (error) {
        console.log("Contract Error!");
      }
      
      return eventTmp;
      
      
    }
    const betEvent = async (bettor, status, betAmount, timeStamp) => {
      
      await fetch();
      
    }
  
    
    if(provider) {
      const singer = provider.getSigner();
      const contract = new ethers.Contract(ContractAddress, ContractABI, singer);
      contract.on('betCompleted', betEvent);
    }

    if(provider){
      fetch();
    }
  }, [provider]);

  const connectWalletPressed = async () => {
    let walletStatus;
    
    walletStatus = await walletDefiwallet.connect(); 
       
    console.log("~~~~~~~~~~~~~~~~~~~~", walletStatus);
    if (walletStatus.address) {
      setProvider(walletStatus.browserWeb3Provider)
      setIsConnected(true);
    } 
    else{
      setUserInfo({message:'connect wallet', launchtime:true})
    }
      
  }

  const bettingHandle = async () => {

      setSpin(true);
      const singer = provider.getSigner();
      try {
        const contract = new ethers.Contract(ContractAddress, ContractABI, singer);
        const time = Date.now();
        let gasPrice = await provider.getGasPrice();
        
        gasPrice.mul(2);
        const transaction = await contract.placeBet(coin, time, { value: ethers.utils.parseUnits(count, 15)})
        //sends 0.1 eth
        const res = await transaction.wait()
        
        if(res.events[0].args[1]) {
          if(coin==='head'){
            setSide('head')
          }
          else{
            setSide('tail')
          }
        }
        else {
          if(coin==='head'){
            setSide('tail')
          }
          else{
            setSide('head')
          }
        }
        setSpin(false)
        setFlipping(true);
        setTimeout(() => setFlipping(false), 1000);

        const userAmount = await contract.users(userInfo.account);
        setAmount(parseInt(userAmount.unclaimed));
      } catch (error) {
        setSpin(false);
        console.log(error);
        alert("Betting Failed!")
      }
      
  };

  const claimHandle = async () => {

      setClaimSpin(true);

      const singer = provider.getSigner();
      try {
        const contract = new ethers.Contract(ContractAddress, ContractABI, singer);
        let tx = await contract.claimRewards()
        //sends 0.1 eth
        await tx.wait()
        
        setClaimSpin(false);
        setAmount(0)
        alert("You earned!")
      } catch (error) {
        setClaimSpin(false);
        alert("Claim failed!")
        
      }
      
    
  }


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
    console.log(output);
    return output;
  }
  return (
    <div className="app">
      <header className='w-full'>
        {isConnected && (
          <div className='flex flex-col justify-center items-end'>
            <div className='text-center'>
              <button className="app-buttons__logout bg-gray-200">
                Disconnect
                
              </button>
              <p>{userInfo?.slice(0,4)}...{userInfo?.slice(38)}</p>
            </div>
            
        </div>
        )}
      </header>
      <div className="app-wrapper">
        {!isConnected && (
          <div>
            <img src={MetamaskLogo} alt="meta mask logo" />
            <button className="app-buttons__login" onClick={connectWalletPressed}>
              Connect to MetaMask
            </button>
          </div>
        )}
      </div>
      {isConnected && (
      <div>
          <div className='mb-5'>
            <Coin side={side} flipping={flipping} />
          </div>
          <div className="app-wrapperrounded-3xl bg-white rounded-3xl border-black border-2">
            <div className='flex gap-4 bg-[#2a74ca] rounded-t-3xl p-3'>
              <div className='flex items-center bg-gradient-to-r from-[#fea800] to-[#fb6000] via-yellow-500 rounded-l-full px-2.5'>
                {options.map((item, key) =>{
                  return <label className='mr-2.5' key={key}>
                    <input type="radio" name="betcount" value={item} checked={count === item} onChange={(e)=> {setCount(e.target.value)}} />
                    {item}
                    </label>
                })}
              </div>
              <div className='flex items-center bg-gradient-to-r from-[#fea800] to-[#fb6000] via-yellow-500 px-2.5'>
                <input className='mr-2.5' type="radio" name="coin" value="head" checked={coin === "head"} onChange={(e)=> {setCoin(e.target.value)}}/>HEAD
                <input className='mx-2.5' type="radio" name="coin" value="tail" checked={coin === "tail"} onChange={(e)=> {setCoin(e.target.value)}}/>TAIL
              </div>
              <button type='button' className='w-28 rounded-none bg-gradient-to-r from-[#fea800] to-[#fb6000] via-yellow-500 text-center mx-auto' onClick={(e)=> bettingHandle()}>
                {spin ? <SpinnerCircular className='mx-auto' size='24' enabled={spin} />:'Betting'}
              </button>
              {
                amount > 0  ? <button type='button' className='w-28 rounded-r-full rounded-l-none bg-gradient-to-r from-[#fea800] to-[#fb6000] via-yellow-500' onClick={(e)=> claimHandle()}>
                  {claimSpin ? <SpinnerCircular className='mx-auto' size='24' enabled={claimSpin} />:'Claim'}
                </button> : <button type='button' className='rounded-r-full rounded-l-none bg-slate-100' disabled>
                  Claim
                </button>
              }
              
            </div>
            <div className='p-3 w-full'>
              <h1 className='font-bold text-xl border-b-2 border-black text-center'>Recent Plays</h1>
              <table className="table-auto w-full">
                <tbody>
                  {eventHistory.length > 0 && eventHistory.map((item, index)=>(
                    <tr className='border-b-2 border-black' key={index}>
                      <td className='p-2'>{`${item.bettor.slice(0, 4)}...${item.bettor.slice(38)}`}</td>
                      <td className='p-2 italic text-[#fb600]'>flipped</td>
                      <td className='p-2'>{utils.formatEther(BigNumber.from(item.betAmount))}</td>
                      <td className='p-2 italic text-[#fb600]'>{item.status ? "Won":"Lost"}</td>
                      <td className='p-2 italic text-[#fb600]'>{relativeTime(item.timeStamp)}</td>
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
