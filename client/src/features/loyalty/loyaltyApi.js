import axiosInstance from "../../utils/axiosInstance";

export const getLoyaltyTiers = () => axiosInstance.get("/loyalty-tiers/public");