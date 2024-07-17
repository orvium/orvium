pragma solidity ^0.5.4;

contract PublicationManagement {

    mapping (bytes32 => Publication) public publications;
    mapping (bytes32 => Review) public reviews;

    struct Publication {
        address owner;
        bytes32 previousVersion;
    }

    struct Review {
        address owner;
        bytes32 publication;
    }

    function addPublication(bytes32 fileIndex, bytes32 previousVersion) public {
        require(publications[fileIndex].owner == address(0), "This file has been already published");
        publications[fileIndex] = Publication(msg.sender, previousVersion);
    }

    function addReview(bytes32 review) public {
        require(reviews[review].owner == address(0), "This peer review has been already published");
        reviews[review] = Review(msg.sender, review);
    }

}
