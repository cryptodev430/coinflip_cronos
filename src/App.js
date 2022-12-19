import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { ethers, BigNumber, utils } from 'ethers';
import MetamaskLogo from './assets/coin.png';
import Coin from "./components/Coin/Coin";
import { ContractAddress, ContractABI } from './ContractABI';
import { SpinnerCircular } from 'spinners-react';
const options = ["10", "50", "100", "200", "300" ];

const Gasprice = {
	low: 149,
	average: 170,
	fast: 466,
}
const calcGasPrice = ethers.utils.parseUnits(
		`${Gasprice.fast}`,
		"gwei"
	)

  

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [count, setCount] = useState('10');
  const [coin, setCoin] = useState('head');
  const [side, setSide] = useState('head');
  const [flipping, setFlipping] = useState(false)
  const [amount, setAmount] = useState()
  const [eventHistory, setEventHistory] = useState([]);
  const [spin, setSpin] = useState(false);
  const [claimSpin, setClaimSpin] = useState(false);

  const { ethereum } = window;

  useEffect(() =>  {
    const checkConnectedWallet = async () => {
      const userData = JSON.parse(localStorage.getItem('userAccount'));
      if (userData != null) {
        setUserInfo(userData);
        setIsConnected(true);
        if(ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const singer = provider.getSigner();
          try {
            const contract = new ethers.Contract(ContractAddress, ContractABI, singer);
            // contract.on('betCompleted', betEvent);
            const userAmount = await contract.users(userData.account);
            setAmount(parseInt(userAmount.unclaimed));
          } catch (error) {
            alert("Contract Error!", error.error)
          }
          
        }
      }
    }

    const fetch = async () => {
      let eventTmp = [];
      if(ethereum) {
        
        const provider = new ethers.providers.Web3Provider(ethereum);
        const singer = provider.getSigner();
        try {
          const contract = new ethers.Contract(ContractAddress, ContractABI, singer);
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
          alert("Contract Error!");
        }
        
        return eventTmp;
      }
      
    }
    const betEvent = async (bettor, status, betAmount, timeStamp) => {
      
      await fetch();
      // eventTmp.push({bettor:bettor, status:status, betAmount:betAmount, timeStamp:timeStamp})
      
    }
  
    if(ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const singer = provider.getSigner();
      const contract = new ethers.Contract(ContractAddress, ContractABI, singer);
      contract.on('betCompleted', betEvent);
    }
    fetch();
    checkConnectedWallet();
  }, [ethereum]);

  

  const bettingHandle = async () => {

    if(ethereum) {
      setSpin(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const singer = provider.getSigner();
      try {
        const contract = new ethers.Contract(ContractAddress, ContractABI, singer);
        const time = Date.now();
        let gasPrice = await provider.getGasPrice();
        
        // gasprice.wait();
        
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
      
    }
  };

  const claimHandle = async () => {
    if(ethereum) {
      setClaimSpin(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const singer = provider.getSigner();
      try {
        const contract = new ethers.Contract(ContractAddress, ContractABI, singer);
        let tx = await contract.claimRewards()
        //sends 0.1 eth
        tx = await tx.wait()
        
        setClaimSpin(false);
        setAmount(0)
        alert("You earned!")
      } catch (error) {
        setClaimSpin(false);
        alert("Claim failed!")
        
      }
      
    }
  }

  const detectCurrentProvider = () => {
    let provider;
    if (window.ethereum) {
      provider = window.ethereum;
    } else if (window.web3) {
      // eslint-disable-next-line
      provider = window.web3.currentProvider;
    } else {
      console.log(
        'Non-Ethereum browser detected. You should consider trying MetaMask!'
      );
    }
    return provider;
  };

  const onConnect = async () => {
    try {
      const currentProvider = detectCurrentProvider();
      if (currentProvider) {
        if (currentProvider !== window.ethereum) {
          console.log(
            'Non-Ethereum browser detected. You should consider trying MetaMask!'
          );
        }
        await currentProvider.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(currentProvider);
        const userAccount = await web3.eth.getAccounts();
        const chainId = await web3.eth.getChainId();
        const account = userAccount[0];
        let ethBalance = await web3.eth.getBalance(account); // Get wallet balance
        ethBalance = web3.utils.fromWei(ethBalance, 'ether'); //Convert balance to wei
        saveUserInfo(ethBalance, account, chainId);
        if (userAccount.length === 0) {
          console.log('Please connect to meta mask');
        }
      }
    } catch (err) {
      console.log(
        'There was an error fetching your accounts. Make sure your Ethereum client is configured correctly.'
      );
    }
  };

  const onDisconnect = () => {
    window.localStorage.removeItem('userAccount');
    setUserInfo({});
    setIsConnected(false);
  };

  const saveUserInfo = (ethBalance, account, chainId) => {
    const userAccount = {
      account: account,
      balance: ethBalance,
      connectionid: chainId,
    };
    window.localStorage.setItem('userAccount', JSON.stringify(userAccount)); //user persisted data
    const userData = JSON.parse(localStorage.getItem('userAccount'));
    setUserInfo(userData);
    setIsConnected(true);
  };

  // const onCountChange = (e) => {
  //   console.log(e.target.value);
  //   setCount(e.target.value);
  // }
  
  // const onCoinChange = (e) => {
  //   console.log(e.target.value);
  //   setCoin(e.target.value);
  // }

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
              <button className="app-buttons__logout bg-gray-200" onClick={onDisconnect}>
                Disconnect
                
              </button>
              <p>{userInfo.account.slice(0,4)}...{userInfo.account.slice(38)}</p>
            </div>
            
        </div>
        )}
      </header>
      <div className="app-wrapper">
        {!isConnected && (
          <div>
            <img src={MetamaskLogo} alt="meta mask logo" />
            <button className="app-buttons__login" onClick={onConnect}>
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
