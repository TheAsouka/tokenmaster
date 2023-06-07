// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TokenMaster is ERC721 {
    address public owner;
    uint256 public totalOccasions; //Event counter, start at 0 by default
    uint256 public totalSupply; // tokenID

    //Occasion = Event => Struct define an Event, not create one
    //Event is a reserved keywork in Sol, can't use it as variable name or else
    struct Occasion {
        uint256 id;
        string name;
        uint256 cost;
        uint256 tickets;
        uint256 maxTickets;
        string date;
        string time;
        string location;
    }

    //Key => value pair
    // id => struct
    mapping(uint256 => Occasion) occasions;
    // idOccasion -> seatNumber => addressOfSeater 
    mapping(uint256 => mapping(uint256 => address)) public seatTaken;

    //Array of taken seats
    mapping(uint256 => uint256[]) seatsTaken;

    //Check if an address has already bought a ticket
    mapping(uint256 => mapping(address => bool)) public hasBought;

    modifier onlyOwner(){
        require(msg.sender == owner);
        // _; -> Function body -> modifier is checked before function is executed
        _;
    }

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol){
        owner = msg.sender;
    }

    function list(
        string memory _name,
        uint256 _cost,
        uint256 _maxTickets,
        string memory _date,
        string memory _time,
        string memory _location
        ) public onlyOwner {
            totalOccasions++;

            //Use mapping -> To save data in the blockchain
            occasions[totalOccasions] = Occasion(
                totalOccasions,
                _name,
                _cost,
                _maxTickets,
                _maxTickets,
                _date,
                _time,
                _location
                );
    }

    function getOccasion(uint256 _id) public view returns (Occasion memory) {
        return occasions[_id];
    }

    function getSeatsTaken(uint256 _id) public view returns (uint256[] memory) {
        return seatsTaken[_id];
    }

    function mint(uint256 _id, uint256 _seat) public payable {

        require(_id != 0);
        //Less than total of occasions
        require(_id <= totalOccasions);
        //Require that the value sent by buyer is superieur or equal to the cost of a ticket
        require(msg.value >= occasions[_id].cost);
        //Require that the seat is not taken and the seat exists
        require(seatTaken[_id][_seat] == address(0));
        require(_seat <= occasions[_id].maxTickets);

        // Update ticket count
        occasions[_id].tickets -= 1;
        hasBought[_id][msg.sender] = true; // Update Buying status
        seatTaken[_id][_seat] = msg.sender; // Assign sea
        seatsTaken[_id].push(_seat); // Updates seats currently taken
        //totalSupply = tokenId
        totalSupply++;

        _safeMint(msg.sender,totalSupply);
    }

    //Permit the owner of the contract to withdraw ether stacked in the contract
    function withdraw() public onlyOwner {
        //{metadata}("data sent through the call")
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }


}
