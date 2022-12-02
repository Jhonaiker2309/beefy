import {
    Box,
    Center,
    Text,
    Stack,
    Button,
    useColorModeValue,
    Input,
    Select
  } from '@chakra-ui/react';
  import {useEffect} from 'react';
  import ZapperJSON from "../../utils/Zapper.json";
  import {ethers} from 'ethers';

  const CONTRACT_ADDRESS = '0x3c1F4e02670DEb92e83ec1f6CcF46A010fF75F9e';
  
   
  export default function Card({ currentAccount,isWMaticBeingUsed, amountOfTokensToSend, amountOfTokensInVault, setIsWMaticBeingUsed, setAmountOfTokensToSend, setAmountOfTokensInVault}) {

    const sendMaticToApp = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const zapperContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            ZapperJSON.abi,
            signer,
        );         
        await zapperContract.investMaticInVaultDirectly({value: ethers.utils.parseEther(amountOfTokensToSend)})
        setAmountOfTokensToSend(0);
    }

    const sendWMaticToApp = async () => {
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const zapperContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ZapperJSON.abi,
          signer,
      );         
      await zapperContract.investWMaticInVaultDirectly(ethers.utils.parseEther(amountOfTokensToSend));
      setAmountOfTokensToSend(0);
    }

    const sentTokensToContract = () => {
        if(isWMaticBeingUsed) {
            sendWMaticToApp();
        } else {
          sendMaticToApp();
        }
    }

    const withdraw = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const zapperContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ZapperJSON.abi,
          signer,
      );         
       await zapperContract.withdraw();
    }    

    useEffect(()=> {
        const getData = async () => {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const zapperContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ZapperJSON.abi,
                signer,
            );         
            const amountOfBeefy = await zapperContract.getAmountOfBalanceOfUser(currentAccount);
            setAmountOfTokensInVault(ethers.utils.formatEther(amountOfBeefy));
            console.log(ethers.utils.formatEther(amountOfBeefy));
        }
        getData();
    },[]);

    return (
        <Center py={6}>
            <Box maxW={'330px'} w={'full'} bg={useColorModeValue('white', 'gray.800')} boxShadow={'2xl'} rounded={'md'} overflow={'hidden'}>
                <Stack textAlign={'center'} p={6} color={useColorModeValue('gray.800', 'white')} align={'center'}>
                    <Text fontSize={'sm'} fontWeight={500} bg={useColorModeValue('green.50', 'green.900')} p={2} px={3} color={'green.500'} rounded={'full'}>
                        Beefy handler App
                    </Text>
                </Stack>
                <Box bg={useColorModeValue('gray.50', 'gray.900')} px={6} py={10}>
                    <Select mb={5} value={isWMaticBeingUsed} onChange={(e => setIsWMaticBeingUsed(e.target.value))}>
                        <option value={false}>Matic</option>
                        <option value={true}>WMatic</option>
                    </Select>            
                    <Input type='number' placeholder='Amount of tokens' value={amountOfTokensToSend} onChange={e => setAmountOfTokensToSend(e.target.value)}/>
                    <Button onClick={()=> sentTokensToContract()} mt={10}w={'full'}bg={'green.400'}color={'white'}rounded={'xl'}boxShadow={'0 5px 20px 0px rgb(72 187 120 / 43%)'}_hover={{bg: 'green.500'}}_focus={{bg: 'green.500'}}>
                        Send tokens
                    </Button>
                    <Button onClick={() => withdraw()} mt={10} w={'full'} bg={'green.400'} color={'white'} rounded={'xl'} boxShadow={'0 5px 20px 0px rgb(72 187 120 / 43%)'}_hover={{bg: 'green.500'}}_focus={{bg: 'green.500'}}>
                        Withdraw all
                    </Button>  
                    <Text>Tokens in app: {amountOfTokensInVault}</Text>          
                </Box>
            </Box>
        </Center>
    );
}