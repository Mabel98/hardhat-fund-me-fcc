// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.7;
// 2. Imports
import "./PriceConverter.sol";
// 3. Interfaces, Libraries, Contracts
error FundMe__NotOwner();

/**@title A sample Funding Contract
 * @author Patrick Collins
 * @notice This contract is for creating a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;

    // State variables
    // use less gas by 'constant'
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    mapping(address => uint256) public s_addressMappingFoundAmount;

    address[] public s_funders;

    // init owner
    // use less gas by 'immutable'
    address public immutable i_owner;

    AggregatorV3Interface private s_aggreagtor;

    // Events (we have none!)

    // Modifiers
    modifier onlyOwner() {
        // check sender.
        //    require(msg.sender == i_owner, "Only the owner could withdraw!");
        // or use
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _; // This means check fistly, then execute next code.
    }

    /// Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    constructor(address priceFeed) {
        i_owner = msg.sender;
        s_aggreagtor = AggregatorV3Interface(priceFeed);
    }

    /// @notice Funds our contract based on the ETH/USD price
    function fundMe() public payable {
        // Want to be able to set a minimum fund amount in USD.
        // 1. How to send ETH to this contract? use payable
        require(
            msg.value.getConversionRate(s_aggreagtor) >= MINIMUM_USD,
            "Didn't send enough!"
        ); // 1e18 : 1*10**18
        //
        s_addressMappingFoundAmount[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    // withdraw
    function withdraw() public onlyOwner {
        // reset mapping
        for (uint i = 0; i < s_funders.length; i++) {
            s_addressMappingFoundAmount[s_funders[i]] = 0;
        }
        // reset array
        s_funders = new address[](0);
        // transfer money
        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        // mappings can't be in memory, sorry!
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressMappingFoundAmount[funder] = 0;
        }
        s_funders = new address[](0);
        // payable(msg.sender).transfer(address(this).balance);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    receive() external payable {
        fundMe();
    }

    fallback() external payable {
        fundMe();
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_aggreagtor;
    }

    /** @notice Gets the amount that an address has funded
     *  @param fundingAddress the address of the funder
     *  @return the amount funded
     */
    function getAddressToAmountFunded(
        address fundingAddress
    ) public view returns (uint256) {
        return s_addressMappingFoundAmount[fundingAddress];
    }
}
