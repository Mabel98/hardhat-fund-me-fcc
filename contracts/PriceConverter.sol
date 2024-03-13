// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getConversionRate(
        uint _ethAmount,
        AggregatorV3Interface aggregator
    ) internal view returns (uint256) {
        (, int256 answer, , , ) = aggregator.latestRoundData();
        uint256 ethPriceInUSD = uint256(answer * 1e10);
        return (ethPriceInUSD * _ethAmount) / 1e18;
    }
}
