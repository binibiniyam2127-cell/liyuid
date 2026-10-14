"use client";

import { useState, useCallback, useTransition } from "react";
import { toast } from "sonner";

export interface RegistryItem {
  id: string;
  code: string;
  category: "Electronics" | "Bags & Luggage" | "Documents" | "Accessories" | "Personal Effects";
  title: string;
  subCity: string;
  specificLocation: string;
  relativeTime: string;
  createdAt: string;
  imageUrl?: string;
  status: "unmatched" | "matched" | "borderline" | "handover_scheduled" | "completed" | "flagged";
  finderResponse: "pending" | "accepted" | "expired" | "not_applicable";
  physicalCheck: {
    required: boolean;
    status: "pending" | "passed" | "discrepancy";
    completedAt?: string;
    verifiedAspectsCount: number;
  };
  securityMetadata: {
    sealedDetailCount: number;
    blindMatchingPassed: boolean;
    anonymizedHash: string;
    isStaffSupervised: boolean;
  };
  reporter: {
    type: "finder" | "owner";
    anonymousId: string;
  };
}

export const INITIAL_REGISTRY_ITEMS: RegistryItem[] = [
  {
    id: "item-001",
    code: "ADD-BOLE-2026-098",
    category: "Electronics",
    title: "Midnight Blue Samsung Galaxy S23 Ultra (Etched Initials on Bezel)",
    subCity: "Bole",
    specificLocation: "Medhane Alem Mall, 2nd Floor Coffee Corridor",
    relativeTime: "12m ago",
    createdAt: "2026-10-03T11:48:00Z",
    imageUrl: "/images/items/smartphone.png",
    status: "matched",
    finderResponse: "accepted",
    physicalCheck: {
      required: true,
      status: "pending",
      verifiedAspectsCount: 3,
    },
    securityMetadata: {
      sealedDetailCount: 3,
      blindMatchingPassed: true,
      anonymizedHash: "sha256:4a8e291f0c...9a7b",
      isStaffSupervised: false,
    },
    reporter: {
      type: "finder",
      anonymousId: "Finder #4029",
    },
  },
  {
    id: "item-002",
    code: "ADD-ARADA-2026-142",
    category: "Bags & Luggage",
    title: "Grey Canvas Waterproof Daypack with Yellow Carabiner Attachment",
    subCity: "Arada",
    specificLocation: "AAU 6-Kilo Science Library, Reading Table B-14",
    relativeTime: "45m ago",
    createdAt: "2026-10-03T11:15:00Z",
    imageUrl: "/images/items/backpack.png",
    status: "handover_scheduled",
    finderResponse: "accepted",
    physicalCheck: {
      required: true,
      status: "pending",
      verifiedAspectsCount: 4,
    },
    securityMetadata: {
      sealedDetailCount: 4,
      blindMatchingPassed: true,
      anonymizedHash: "sha256:7b11d820ce...5f32",
      isStaffSupervised: true,
    },
    reporter: {
      type: "owner",
      anonymousId: "Owner #9931",
    },
  },
  {
    id: "item-003",
    code: "ADD-KIRKOS-2026-055",
    category: "Electronics",
    title: "Apple AirPods Pro Gen 2 with Custom Leather Protective Skin",
    subCity: "Kirkos",
    specificLocation: "Mexico Square Light Rail Station, Platform 1",
    relativeTime: "2h ago",
    createdAt: "2026-10-03T10:00:00Z",
    imageUrl: "/images/items/wireless_earbuds.png",
    status: "borderline",
    finderResponse: "pending",
    physicalCheck: {
      required: true,
      status: "pending",
      verifiedAspectsCount: 2,
    },
    securityMetadata: {
      sealedDetailCount: 3,
      blindMatchingPassed: false,
      anonymizedHash: "sha256:39ac01ff44...81cd",
      isStaffSupervised: true,
    },
    reporter: {
      type: "finder",
      anonymousId: "Finder #1104",
    },
  },
  {
    id: "item-004",
    code: "ADD-YERA-2026-021",
    category: "Documents",
    title: "Ethiopian Regular Passport & Accompanying Transit Wallet (Blue Cover)",
    subCity: "Yeka",
    specificLocation: "Megenagna Shola Market, Commercial Bank Branch Entrance",
    relativeTime: "4h ago",
    createdAt: "2026-10-03T08:00:00Z",
    imageUrl: "/images/items/passport.png",
    status: "completed",
    finderResponse: "accepted",
    physicalCheck: {
      required: true,
      status: "passed",
      completedAt: "2026-10-03T11:30:00Z",
      verifiedAspectsCount: 3,
    },
    securityMetadata: {
      sealedDetailCount: 3,
      blindMatchingPassed: true,
      anonymizedHash: "sha256:99de3204aa...22b1",
      isStaffSupervised: true,
    },
    reporter: {
      type: "finder",
      anonymousId: "Staff Officer #AA-10",
    },
  },
  {
    id: "item-005",
    code: "ADD-LIDE-2026-114",
    category: "Accessories",
    title: "Heavy Solid Brass Keyring with 4 Security Keys and Leather Keychain Fob",
    subCity: "Lideta",
    specificLocation: "Federal High Court Public Courtyard Bench",
    relativeTime: "Yesterday",
    createdAt: "2026-10-02T15:30:00Z",
    imageUrl: "/images/items/keys.png",
    status: "unmatched",
    finderResponse: "not_applicable",
    physicalCheck: {
      required: false,
      status: "pending",
      verifiedAspectsCount: 0,
    },
    securityMetadata: {
      sealedDetailCount: 3,
      blindMatchingPassed: false,
      anonymizedHash: "sha256:1a84f3299c...33c9",
      isStaffSupervised: false,
    },
    reporter: {
      type: "finder",
      anonymousId: "Finder #8741",
    },
  },
  {
    id: "item-006",
    code: "ADD-GULL-2026-077",
    category: "Electronics",
    title: "Dell XPS 13 InfinityEdge Developer Laptop in Charcoal Felt Sleeve",
    subCity: "Gullele",
    specificLocation: "Science Museum Auditorium, Row G Seat 12",
    relativeTime: "2 days ago",
    createdAt: "2026-10-01T14:15:00Z",
    imageUrl: "/images/items/laptop.png",
    status: "flagged",
    finderResponse: "expired",
    physicalCheck: {
      required: true,
      status: "discrepancy",
      completedAt: "2026-10-02T10:00:00Z",
      verifiedAspectsCount: 1,
    },
    securityMetadata: {
      sealedDetailCount: 3,
      blindMatchingPassed: false,
      anonymizedHash: "sha256:66be09fa31...99ef",
      isStaffSupervised: true,
    },
    reporter: {
      type: "owner",
      anonymousId: "Owner #5512",
    },
  },
  {
    id: "item-007",
    code: "ADD-BOLE-2026-189",
    category: "Personal Effects",
    title: "Handmade Textured Brown Leather Bi-fold Wallet with Hand-stitched Seams (Edge Case: Very Long Descriptive Label For Overflow Testing In Responsive Grid Layouts)",
    subCity: "Bole",
    specificLocation: "Bole International Airport, Terminal 2 Domestic Baggage Claim",
    relativeTime: "Just now",
    createdAt: "2026-10-03T11:58:00Z",
    // Missing image to test graceful fallback
    imageUrl: undefined,
    status: "matched",
    finderResponse: "pending",
    physicalCheck: {
      required: true,
      status: "pending",
      verifiedAspectsCount: 3,
    },
    securityMetadata: {
      sealedDetailCount: 3,
      blindMatchingPassed: true,
      anonymizedHash: "sha256:a44c9b110e...88ad",
      isStaffSupervised: false,
    },
    reporter: {
      type: "finder",
      anonymousId: "Finder #3319",
    },
  },
];

export function useDataFlow() {
  const [items, setItems] = useState<RegistryItem[]>(INITIAL_REGISTRY_ITEMS);
  const [filter, setFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  // Optimistic verification update with 400ms simulated latency
  const markVerified = useCallback(async (id: string) => {
    setLoadingItemId(id);
    const previous = [...items];

    // Optimistic Update
    setItems((curr) =>
      curr.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "handover_scheduled",
              physicalCheck: {
                ...item.physicalCheck,
                status: "passed",
                completedAt: new Date().toISOString(),
              },
            }
          : item
      )
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success("Verification sealed successfully", {
        description: `Physical check passed for item ${id}. Handover code unlocked.`,
      });
    } catch {
      // Rollback on error
      setItems(previous);
      toast.error("Failed to complete verification", {
        description: "Network latency error. Please retry.",
      });
    } finally {
      setLoadingItemId(null);
    }
  }, [items]);

  // Optimistic flag mutation
  const flagItem = useCallback(async (id: string, reason: string) => {
    setLoadingItemId(id);
    const previous = [...items];

    setItems((curr) =>
      curr.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "flagged",
              physicalCheck: {
                ...item.physicalCheck,
                status: "discrepancy",
              },
            }
          : item
      )
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.warning("Flag escalated to staff review", {
        description: `Reason: ${reason || "Physical item discrepancy at handover"}`,
      });
    } catch {
      setItems(previous);
      toast.error("Escalation failed");
    } finally {
      setLoadingItemId(null);
    }
  }, [items]);

  // Optimistic complete handover
  const completeHandover = useCallback(async (id: string, verificationCode: string) => {
    if (!verificationCode || verificationCode.trim().length < 4) {
      toast.error("Invalid handover code", {
        description: "Please provide a valid 6-character verification code.",
      });
      return false;
    }

    setLoadingItemId(id);
    const previous = [...items];

    setItems((curr) =>
      curr.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "completed",
              physicalCheck: {
                ...item.physicalCheck,
                status: "passed",
                completedAt: new Date().toISOString(),
              },
            }
          : item
      )
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success("Handover successfully completed", {
        description: "Item custody transferred. Registry entry closed and archived.",
      });
      return true;
    } catch {
      setItems(previous);
      toast.error("Handover completion failed");
      return false;
    } finally {
      setLoadingItemId(null);
    }
  }, [items]);

  // Reset to initial state
  const resetData = useCallback(() => {
    setItems(INITIAL_REGISTRY_ITEMS);
    toast.info("Registry data reset to defaults");
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  return {
    items: filteredItems,
    allItems: items,
    filter,
    setFilter,
    isPending,
    loadingItemId,
    markVerified,
    flagItem,
    completeHandover,
    resetData,
  };
}
