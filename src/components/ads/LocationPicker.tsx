"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, MapPin, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SL_LOCATIONS } from "@/lib/ads-locations";

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (district: string, localArea: string) => void;
  showResetAndPostCount?: boolean;
  initialDistrict?: string;
  initialLocalArea?: string;
}

export function LocationPicker({
  isOpen,
  onClose,
  onSelect,
  showResetAndPostCount = false,
  initialDistrict,
  initialLocalArea,
}: LocationPickerProps) {
  const districts = Object.keys(SL_LOCATIONS);
  const [tempDistrict, setTempDistrict] = useState<string>("Colombo");
  const [tempLocalArea, setTempLocalArea] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [postCount, setPostCount] = useState<number>(0);
  const [loadingCount, setLoadingCount] = useState<boolean>(false);

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (showResetAndPostCount) {
        setTempDistrict(initialDistrict || "All of Sri Lanka");
        setTempLocalArea(initialLocalArea || null);
      } else {
        setTempDistrict(initialDistrict && initialDistrict !== "All of Sri Lanka" ? initialDistrict : "Colombo");
        setTempLocalArea(initialLocalArea || null);
      }
    }
  }, [isOpen, initialDistrict, initialLocalArea, showResetAndPostCount]);

  // Fetch count of matching posts dynamically for this location
  useEffect(() => {
    if (!isOpen || !showResetAndPostCount) return;

    let active = true;
    const fetchCount = async () => {
      setLoadingCount(true);
      try {
        const queryParams = new URLSearchParams({
          pageSize: "1",
        });
        if (tempDistrict && tempDistrict !== "All of Sri Lanka") {
          queryParams.append("district", tempDistrict);
        }
        if (tempLocalArea) {
          queryParams.append("localArea", tempLocalArea);
        }

        const res = await fetch(`/api/ads/public?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success && active) {
          setPostCount(data.data.pagination.totalCount);
        }
      } catch (err) {
        console.error("Error fetching location post count:", err);
      } finally {
        if (active) setLoadingCount(false);
      }
    };

    fetchCount();
    return () => {
      active = false;
    };
  }, [tempDistrict, tempLocalArea, isOpen, showResetAndPostCount]);

  const districtData = SL_LOCATIONS[tempDistrict] || { popular: [], all: [] };

  // Filter districts and areas based on search query
  const filteredDistricts = districts.filter((d) => {
    if (d.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    const data = SL_LOCATIONS[d];
    return data.all.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const popularFiltered = districtData.popular.filter((a) =>
    a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFiltered = districtData.all.filter((a) =>
    a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDistrictSelect = (district: string) => {
    setTempDistrict(district);
    setTempLocalArea(null);
  };

  const handleAreaSelect = (area: string) => {
    if (showResetAndPostCount) {
      setTempLocalArea(area);
    } else {
      onSelect(tempDistrict, area);
      onClose();
    }
  };

  const handleApply = () => {
    if (tempDistrict === "All of Sri Lanka" || !tempDistrict) {
      onSelect("All of Sri Lanka", "");
    } else {
      onSelect(tempDistrict, tempLocalArea || "");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] h-[80vh] md:h-[600px] p-0 overflow-hidden flex flex-col rounded-2xl border border-gray-100 shadow-2xl bg-white/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#FF6600]" />
            <span>Select Location</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm mt-1">
            Choose the district and local area where your item or service is located
          </DialogDescription>

          {/* Search bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search district, city or division..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] transition-all"
            />
          </div>
        </DialogHeader>

        <div className="flex-grow flex overflow-hidden">
          {/* Left Panel: Districts */}
          <div className="w-[40%] md:w-[250px] border-r border-gray-100 flex flex-col bg-gray-50/50">
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {showResetAndPostCount && (
                  <button
                    onClick={() => {
                      setTempDistrict("All of Sri Lanka");
                      setTempLocalArea(null);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm font-semibold hover:underline mb-2 text-blue-600",
                      (tempDistrict === "All of Sri Lanka" || !tempDistrict) && "text-[#FF6600] font-bold"
                    )}
                  >
                    All of Sri Lanka
                  </button>
                )}
                {filteredDistricts.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDistrictSelect(d)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200",
                      tempDistrict === d
                        ? "bg-white text-[#FF6600] shadow-sm border border-gray-100 font-semibold"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <span>{d}</span>
                    <ChevronRight className={cn(
                      "h-4 w-4 text-gray-400 transition-transform",
                      tempDistrict === d && "text-[#FF6600] translate-x-0.5"
                    )} />
                  </button>
                ))}
                {filteredDistricts.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No locations found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Areas */}
          <div className="flex-1 flex flex-col bg-white">
            <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/30">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {tempDistrict === "All of Sri Lanka" ? "Areas" : `${tempDistrict} Areas`}
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {tempDistrict === "All of Sri Lanka" ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    Select a district on the left to view areas
                  </div>
                ) : (
                  <>
                    {/* All [District] option */}
                    {showResetAndPostCount && (
                      <button
                        onClick={() => {
                          setTempLocalArea(null);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm font-semibold hover:underline mb-2 text-blue-600",
                          tempLocalArea === null && "text-[#FF6600] font-bold"
                        )}
                      >
                        All {tempDistrict}
                      </button>
                    )}

                    {/* Popular section */}
                    {popularFiltered.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
                          Popular Areas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          {popularFiltered.map((area) => (
                            <button
                              key={`pop-${area}`}
                              onClick={() => handleAreaSelect(area)}
                              className={cn(
                                "flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-colors border",
                                tempLocalArea === area
                                  ? "bg-orange-50/50 text-[#FF6600] font-semibold border-orange-100 shadow-sm"
                                  : "text-gray-700 hover:bg-orange-50/30 hover:text-[#FF6600] border-dashed border-gray-100 hover:border-orange-100"
                              )}
                            >
                              {area}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All areas list */}
                    {allFiltered.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
                          All Areas (A-Z)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          {allFiltered.map((area) => (
                            <button
                              key={`all-${area}`}
                              onClick={() => handleAreaSelect(area)}
                              className={cn(
                                "flex items-center justify-between px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-colors border border-transparent",
                                tempLocalArea === area
                                  ? "bg-orange-50/50 text-[#FF6600] font-semibold border-orange-100 shadow-sm"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-[#FF6600]"
                              )}
                            >
                              {area}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {popularFiltered.length === 0 && allFiltered.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No matching areas found in {tempDistrict}
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {showResetAndPostCount && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <button
              onClick={() => {
                setTempDistrict("All of Sri Lanka");
                setTempLocalArea(null);
              }}
              className="px-5 py-2 border border-teal-600 hover:bg-teal-50/50 text-teal-700 text-sm font-bold rounded-xl transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              disabled={loadingCount}
            >
              {loadingCount && <Loader2 className="h-4 w-4 animate-spin text-white" />}
              <span>Show {loadingCount ? "..." : postCount.toLocaleString()} posts</span>
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
