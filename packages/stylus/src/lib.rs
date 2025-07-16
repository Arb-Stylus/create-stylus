//! The program is ABI-equivalent with Solidity, which means you can call it from both Solidity and Rust.
//! To do this, run `cargo stylus export-abi`.
//!
// Allow `cargo stylus export-abi` to generate a main function.
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::{string::String, vec::Vec};

use alloy_sol_types::sol;
/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    console,
    prelude::*,
    storage::*,
    stylus_core::log,
};

// Events: a way to emit log statements from smart contract that can be listened to by external parties
sol! {
    event GreetingChange(address indexed greetingSetter, string newGreeting, bool premium, uint256 value);
}

// Define some persistent storage using the Solidity ABI.
// `YourContract` will be the entrypoint.
#[storage]
#[entrypoint]
pub struct YourContract {
    owner: StorageAddress,
    greeting: StorageString,
    premium: StorageBool,
    total_counter: StorageU256,
    user_greeting_counter: StorageMap<Address, StorageU256>,
}

/// Declare that `Counter` is a contract with the following external methods.
#[public]
impl YourContract {
    // Constructor: Called once on contract deployment
    #[constructor]
    pub fn constructor(&mut self, owner: Address) {
        self.owner.set(owner);
        self.greeting
            .set_str(String::from("Building Unstoppable Apps!!!"));
        self.premium.set(false);
        self.total_counter.set(U256::ZERO);
    }

    pub fn get_greeting(&self) -> String {
        self.greeting.get_string()
    }

    pub fn get_premium(&self) -> bool {
        self.premium.get()
    }

    pub fn get_total_counter(&self) -> U256 {
        self.total_counter.get()
    }

    /**
     * Function that allows anyone to change the state variable "greeting" of the contract and increase the counters
     *
     * @param _newGreeting (string memory) - new greeting to save on the contract
     */
    #[payable]
    pub fn set_greeting(&mut self, new_greeting: String) {
        let msg = self.vm().msg_sender();
        let new_greeting_str = new_greeting.clone();
        console!("Setting new greeting {new_greeting_str} from {msg}");
        self.greeting.set_str(new_greeting_str);
        let total_counter = self.total_counter.get();
        self.total_counter.set(total_counter + U256::from(1));

        let user_greeting_counter = self.user_greeting_counter.get(msg);
        self.user_greeting_counter
            .setter(msg)
            .set(user_greeting_counter + U256::from(1));

        if self.vm().msg_value() > U256::ZERO {
            self.premium.set(true);
        } else {
            self.premium.set(false);
        }

        log(
            self.vm(),
            GreetingChange {
                greetingSetter: msg,
                newGreeting: new_greeting.clone(),
                premium: self.vm().msg_value() > U256::ZERO,
                value: self.vm().msg_value(),
            },
        );
    }

    /**
     * Function that allows the owner to withdraw all the Ether in the contract
     * The function can only be called by the owner of the contract as defined by the isOwner modifier
     */
    #[payable]
    pub fn withdraw(&mut self) {
        if self.vm().msg_sender() != self.owner.get() {
            panic!("Only owner can withdraw");
        }

        let balance = self.vm().balance(self.vm().contract_address());
        match self.vm().transfer_eth(self.vm().msg_sender(), balance) {
            Ok(_) => (),
            Err(_) => panic!("Failed to send ether."),
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_counter() {
        use stylus_sdk::testing::*;
        let vm = TestVM::default();
        let mut contract = YourContract::from(&vm);

        /*assert_eq!(U256::ZERO, contract.number());

        contract.increment();
        assert_eq!(U256::from(1), contract.number());

        contract.add_number(U256::from(3));
        assert_eq!(U256::from(4), contract.number());

        contract.mul_number(U256::from(2));
        assert_eq!(U256::from(8), contract.number());

        contract.set_number(U256::from(100));
        assert_eq!(U256::from(100), contract.number());

        // Override the msg value for future contract method invocations.
        vm.set_value(U256::from(2));

        contract.add_from_msg_value();
        assert_eq!(U256::from(102), contract.number());*/
    }
}
