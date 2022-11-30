// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IUniswap.sol";
import "../interfaces/IBeefy.sol";
import "hardhat/console.sol";


contract Zapper {
    address private constant ROUTER = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
    address private constant WMATIC= 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;   
    address private token1;
    address private token2; 
    address private FACTORY;
    IVault public vaultContract;
    IERC20 public liquidityToken;

    mapping(address => uint) private amountOfTokensByUser;

    constructor(
        address _vaultContract,
        address _token1,
        address _token2
    ) {
          vaultContract = IVault(_vaultContract);
          liquidityToken = vaultContract.want();
          FACTORY = IUniswapV2Router(ROUTER).factory();
          token1 = _token1;
          token2 = _token2;
          require(
              address(liquidityToken) == IUniswapV2Factory(FACTORY).getPair(_token1, _token2),
              "The lp of the 2 tokens must be the same that the lp of the vault"
          );
      }  


// Functions to add money to the contract
    function investMaticInVaultDirectly() payable public {
        uint[2] memory amountOfTokens = swap2TokensFromMatic([token1, token2], msg.value);
        uint liquidity = addLiquidity(token1, token2, amountOfTokens[0], amountOfTokens[1]);
        uint tokensInContractBeforeActionOfUser = vaultContract.balanceOf(address(this));
        IERC20(liquidityToken).approve(address(vaultContract), liquidity);
        vaultContract.deposit(liquidity);
        uint tokensInContractAfterActionOfUser = vaultContract.balanceOf(address(this));
        uint tokensAddedByUser = tokensInContractAfterActionOfUser - tokensInContractBeforeActionOfUser;
        amountOfTokensByUser[msg.sender] += tokensAddedByUser;
    }

    function investWMaticInVaultDirectly(uint _wMaticAmount) payable public {
        IERC20(WMATIC).transferFrom(msg.sender, address(this), _wMaticAmount);
        uint[2] memory amountOfTokens = swap2TokensFromWMatic([token1, token2], _wMaticAmount);
        uint liquidity = addLiquidity(token1, token2, amountOfTokens[0], amountOfTokens[1]);
        uint tokensInContractBeforeActionOfUser = vaultContract.balanceOf(address(this));
        IERC20(liquidityToken).approve(address(vaultContract), liquidity);
        vaultContract.deposit(liquidity);
        uint tokensInContractAfterActionOfUser = vaultContract.balanceOf(address(this));
        uint tokensAddedByUser = tokensInContractAfterActionOfUser - tokensInContractBeforeActionOfUser;
        amountOfTokensByUser[msg.sender] += tokensAddedByUser;
    }  


//Function to withdraw money

    function withdraw() public {
        require(amountOfTokensByUser[msg.sender] > 0, "The user has to have money invested in the contract");
        uint amountToWithdraw = amountOfTokensByUser[msg.sender];
        amountOfTokensByUser[msg.sender] = 0;
        vaultContract.withdraw(amountToWithdraw);
        uint liquidTokenForUser = liquidityToken.balanceOf(address(this));

        (uint amount1, uint amount2) = removeLiquidity(token1,token2,liquidTokenForUser);

        address[] memory path1 = getPathOfWMaticAndToken(token1, false); 
        address[] memory path2 = getPathOfWMaticAndToken(token2, false); 
        IERC20(token1).approve(ROUTER, amount1);
        IERC20(token2).approve(ROUTER, amount2);  

        IUniswapV2Router(ROUTER).swapExactTokensForTokens(amount1,1, path1, msg.sender, block.timestamp);
        IUniswapV2Router(ROUTER).swapExactTokensForTokens(amount2,1, path2, msg.sender, block.timestamp);
    }


// Functions that add and remove liquidity
    function removeLiquidity(address _tokenA, address _tokenB, uint _amount) private returns (uint, uint){
        address pair = IUniswapV2Factory(FACTORY).getPair(_tokenA, _tokenB);

        IERC20(pair).approve(ROUTER, _amount);

        (uint amountA, uint amountB) =
            IUniswapV2Router(ROUTER).removeLiquidity(
                _tokenA,
                _tokenB,
                _amount,
                1,
                1,
                address(this),
                block.timestamp
            );

        return(amountA, amountB);
    }

    function addLiquidity(address _tokenA,address _tokenB,uint _amountA,uint _amountB) public returns (uint) {

        IERC20(_tokenA).approve(ROUTER, _amountA);
        IERC20(_tokenB).approve(ROUTER, _amountB);

        (,,uint liquidity) =
        IUniswapV2Router(ROUTER).addLiquidity(
            _tokenA,
            _tokenB,
            _amountA,
            _amountB,
            1,
            1,
            address(this),
            block.timestamp
        );

        uint tokenToRefoundA = IERC20(_tokenA).balanceOf(address(this));
        uint tokenToRefoundB = IERC20(_tokenB).balanceOf(address(this));


        if(tokenToRefoundA > 0){
            IERC20(_tokenA).transfer(msg.sender, tokenToRefoundA);
        }

        if(tokenToRefoundB > 0){
            IERC20(_tokenB).transfer(msg.sender, tokenToRefoundB);
        }

        if(address(this).balance > 0){

            (bool _success,) = msg.sender.call{ value: address(this).balance }("");
            require(_success, "Liquidity refound failed");
        }

        return liquidity;
    }

// Functions to get paths for swaps
    function getPathOfMaticAndToken(address _tokenOut) public pure returns(address[] memory){
        address[] memory path = new address[](2);
        path[0] = WMATIC;
        path[1] = _tokenOut;
        return path;
    }              

    function getPathOfWMaticAndToken(address _tokenExtra, bool _changeFromWMaticToOtherToken) public pure returns(address[] memory) {
        address[] memory path;
        path = new address[](2);
        if(_changeFromWMaticToOtherToken){
            path[0] = WMATIC;
            path[1] = _tokenExtra; 
        } else {
            path[0] = _tokenExtra;    
            path[1] = WMATIC;       
        }

        return path;
    }     

// Functions to make swaps
    function swap2TokensFromMatic(address[2] memory _tokensOut, uint _amountOfMatic) private returns(uint[2] memory){
        IERC20(WMATIC).approve(ROUTER, _amountOfMatic);
        uint[] memory listOfValues; 
        uint[2] memory listOfValuesSwapped;
        uint valueOfTransaction = _amountOfMatic / 2;

        for(uint i = 0; i < _tokensOut.length; i++){
            address[] memory path = getPathOfMaticAndToken(_tokensOut[i]);       
            listOfValues = IUniswapV2Router(ROUTER).swapExactETHForTokens{value: valueOfTransaction}(1, path, address(this), block.timestamp);
            listOfValuesSwapped[i] = listOfValues[1];
        }

        return listOfValuesSwapped;
    }

    function swap2TokensFromWMatic(address[2] memory _tokensOut, uint _amountOfWMatic) private returns(uint[2] memory){
        uint[] memory listOfValues; 
        uint[2] memory listOfValuesSwapped;
        uint valueOfTransaction = _amountOfWMatic / 2;

        for(uint i = 0; i < _tokensOut.length; i++){
            address[] memory path = getPathOfWMaticAndToken(_tokensOut[i], true);       
            listOfValues = IUniswapV2Router(ROUTER).swapExactTokensForTokens(valueOfTransaction,1, path, address(this), block.timestamp);
            listOfValuesSwapped[i] = listOfValues[1];
        }

        return listOfValuesSwapped;
    }   

    function getAmountOfBalanceOfUser(address _user) view public returns (uint balanceOfUser) {
        return amountOfTokensByUser[_user];
    }    
}

