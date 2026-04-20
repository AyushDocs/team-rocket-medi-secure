// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract RoleManager is Ownable {
    mapping(address => uint8) private _roles;
    mapping(address => mapping(address => bool)) private _roleAdmins;

    uint8 public constant ROLE_NONE = 0;
    uint8 public constant ROLE_ADMIN = 1;
    uint8 public constant ROLE_PROVIDER = 2;
    uint8 public constant ROLE_VERIFIER = 3;
    uint8 public constant ROLE_AUDITOR = 4;

    event RoleGranted(address indexed account, uint8 role);
    event RoleRevoked(address indexed account, uint8 role);

    modifier onlyRole(uint8 _role) {
        require(
            _roles[msg.sender] == _role || msg.sender == owner(),
            "Unauthorized"
        );
        _;
    }

    modifier onlyAdminOrOwner() {
        require(
            _roles[msg.sender] == ROLE_ADMIN || msg.sender == owner(),
            "Not admin"
        );
        _;
    }

    function grantRole(
        address _account,
        uint8 _role
    ) external onlyAdminOrOwner {
        _roles[_account] = _role;
        emit RoleGranted(_account, _role);
    }

    function revokeRole(address _account) external onlyAdminOrOwner {
        _roles[_account] = ROLE_NONE;
        emit RoleRevoked(_account, _roles[_account]);
    }

    function getRole(address _account) external view returns (uint8) {
        return _roles[_account];
    }

    function hasRole(
        address _account,
        uint8 _role
    ) external view returns (bool) {
        return _roles[_account] == _role || msg.sender == owner();
    }

    function isAdmin(address _account) external view returns (bool) {
        return _roles[_account] == ROLE_ADMIN || _account == owner();
    }
}
