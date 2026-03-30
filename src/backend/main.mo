import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Migration setup


actor {
  /////////////////////////////////////////////////////////////
  // Components & Authorization

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  /////////////////////////////////////////////////////////////
  // User Profiles

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  /////////////////////////////////////////////////////////////
  // Quotes

  public type QuoteId = Nat;

  public type Quote = {
    clientName : Text;
    itemsSummary : Text; // JSON string
    totalCents : Nat;
    timestamp : Time.Time;
  };

  module QuoteEntry {
    public func compare(b : Entry, a : Entry) : Order.Order {
      Nat.compare(a.0, b.0);
    };
  };

  type Entry = (QuoteId, Quote);

  var nextQuoteId = 0;

  let quotes = Map.empty<QuoteId, Quote>();

  // Save quote
  public shared ({ caller }) func saveQuote(clientName : Text, itemsSummary : Text, totalCents : Nat) : async QuoteId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save quotes");
    };

    let quoteId = nextQuoteId;
    let quote : Quote = {
      clientName;
      itemsSummary;
      totalCents;
      timestamp = Time.now();
    };
    quotes.add(quoteId, quote);
    nextQuoteId += 1;
    quoteId;
  };

  // List all quotes (admin only)
  public query ({ caller }) func listAllQuotes() : async [(QuoteId, Quote)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all quotes");
    };

    quotes.toArray().sort();
  };

  // Delete quote (admin only)
  public shared ({ caller }) func deleteQuote(quoteId : QuoteId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete quotes");
    };
    if (quotes.containsKey(quoteId)) {
      quotes.remove(quoteId);
    } else {
      Runtime.trap("Quote not found");
    };
  };
};
