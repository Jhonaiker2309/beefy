import {useEffect, useState} from 'react';
import { Box,Button } from '@chakra-ui/react'
import Card from './components/card/card';


function App() {
    const [currentAccount, setCurrentAccount] = useState('');
    const [isWMaticBeingUsed, setIsWMaticBeingUsed] = useState(false);
    const [amountOfTokensToSend, setAmountOfTokensToSend] = useState(0);
    const [amountOfTokensInVault, setAmountOfTokensInVault] = useState(0);

    const checkIfWalletIsConnected = async () => {
        const { ethereum } = window;
  
        if (!ethereum) {
            console.log("You don't have metamask");
            return;
        } else {
            console.log("We have an ethereum object", ethereum); 
            const accounts = await ethereum.request({ method: "eth_accounts" });
  
            if (accounts.length > 0) {
                const account = accounts[0];
                console.log("Found authorized account", account);
                setCurrentAccount(account);
            } else {
                console.log("Not authorized account found");
            }
        }
    };    

	const connectWalletAction = async () => {
	    try {
		    const { ethereum } = window;
			if (!ethereum) {
		        console.log("Get metamask");
		        return;
		    }

		    const accounts = await ethereum.request({
			    method: "eth_requestAccounts",
		    });

		    const account = accounts[0];
		    setCurrentAccount(account);
		} catch (error) {
			console.log(error);
		}
	};

    const checkNetwork = async () => {
		try {
		    if (window.ethereum.networkVersion !== "137") {
		      alert("Please connect to Polygon!");
		    }
	    } catch (error) {
		    console.log(error);
		}
	};


    useEffect(() => {
        checkIfWalletIsConnected();
        checkNetwork();
    }, []);
 
    return (
        <Box >
            {currentAccount.length === 0 ? 
            <Button onClick={() => connectWalletAction()}>Connect</Button> : 
            <Card setAmountOfTokensInVault={setAmountOfTokensInVault} currentAccount={currentAccount} isWMaticBeingUsed={isWMaticBeingUsed} amountOfTokensToSend={amountOfTokensToSend} amountOfTokensInVault={amountOfTokensInVault} setIsWMaticBeingUsed={setIsWMaticBeingUsed} setAmountOfTokensToSend={setAmountOfTokensToSend} />}
        </Box>
    );
}

export default App;
