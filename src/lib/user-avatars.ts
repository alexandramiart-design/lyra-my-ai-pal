import f1 from "@/assets/user-f1.jpg.asset.json";
import f2 from "@/assets/user-f2.jpg.asset.json";
import f3 from "@/assets/user-f3.jpg.asset.json";
import f4 from "@/assets/user-f4.jpg.asset.json";
import f5 from "@/assets/user-f5.jpg.asset.json";
import f6 from "@/assets/user-f6.jpg.asset.json";
import f7 from "@/assets/user-f7.jpg.asset.json";
import f8 from "@/assets/user-f8.jpg.asset.json";
import f9 from "@/assets/user-f9.jpg.asset.json";
import f10 from "@/assets/user-f10.jpg.asset.json";
import f11 from "@/assets/user-f11.jpg.asset.json";
import f12 from "@/assets/user-f12.jpg.asset.json";
import f13 from "@/assets/user-f13.jpg.asset.json";
import f14 from "@/assets/user-f14.jpg.asset.json";
import f15 from "@/assets/user-f15.jpg.asset.json";
import f16 from "@/assets/user-f16.jpg.asset.json";
import f17 from "@/assets/user-f17.jpg.asset.json";
import f18 from "@/assets/user-f18.jpg.asset.json";
import f19 from "@/assets/user-f19.jpg.asset.json";
import f20 from "@/assets/user-f20.jpg.asset.json";
import m1 from "@/assets/user-m1.jpg.asset.json";
import m2 from "@/assets/user-m2.jpg.asset.json";
import m3 from "@/assets/user-m3.jpg.asset.json";
import m4 from "@/assets/user-m4.jpg.asset.json";
import m5 from "@/assets/user-m5.jpg.asset.json";
import m6 from "@/assets/user-m6.jpg.asset.json";
import m7 from "@/assets/user-m7.jpg.asset.json";
import m8 from "@/assets/user-m8.jpg.asset.json";
import m9 from "@/assets/user-m9.jpg.asset.json";
import m10 from "@/assets/user-m10.jpg.asset.json";
import m11 from "@/assets/user-m11.jpg.asset.json";
import m12 from "@/assets/user-m12.jpg.asset.json";
import m13 from "@/assets/user-m13.jpg.asset.json";
import m14 from "@/assets/user-m14.jpg.asset.json";
import m15 from "@/assets/user-m15.jpg.asset.json";
import m16 from "@/assets/user-m16.jpg.asset.json";
import m17 from "@/assets/user-m17.jpg.asset.json";
import m18 from "@/assets/user-m18.jpg.asset.json";
import m19 from "@/assets/user-m19.jpg.asset.json";
import m20 from "@/assets/user-m20.jpg.asset.json";

import n1 from "@/assets/user-n1.jpg.asset.json";
import n2 from "@/assets/user-n2.jpg.asset.json";
import n3 from "@/assets/user-n3.jpg.asset.json";
import n4 from "@/assets/user-n4.jpg.asset.json";
import n5 from "@/assets/user-n5.jpg.asset.json";
import n6 from "@/assets/user-n6.jpg.asset.json";
import n7 from "@/assets/user-n7.jpg.asset.json";
import n8 from "@/assets/user-n8.jpg.asset.json";
import n9 from "@/assets/user-n9.jpg.asset.json";
import n10 from "@/assets/user-n10.jpg.asset.json";
import n11 from "@/assets/user-n11.jpg.asset.json";
import n12 from "@/assets/user-n12.jpg.asset.json";
import n13 from "@/assets/user-n13.jpg.asset.json";
import n14 from "@/assets/user-n14.jpg.asset.json";
import n15 from "@/assets/user-n15.jpg.asset.json";
import n16 from "@/assets/user-n16.jpg.asset.json";
import n17 from "@/assets/user-n17.jpg.asset.json";
import n18 from "@/assets/user-n18.jpg.asset.json";
import n19 from "@/assets/user-n19.jpg.asset.json";
import n20 from "@/assets/user-n20.jpg.asset.json";

export const FEMALE_AVATARS: string[] = [
  f1, f2, f3, f4, f5, f6, f7, f8, f9, f10,
  f11, f12, f13, f14, f15, f16, f17, f18, f19, f20,
].map((a) => a.url);

export const MALE_AVATARS: string[] = [
  m1, m2, m3, m4, m5, m6, m7, m8, m9, m10,
  m11, m12, m13, m14, m15, m16, m17, m18, m19, m20,
].map((a) => a.url);

export const NONBINARY_AVATARS: string[] = [
  n1, n2, n3, n4, n5, n6, n7, n8, n9, n10,
  n11, n12, n13, n14, n15, n16, n17, n18, n19, n20,
].map((a) => a.url);

export type Gender = "male" | "female" | "nonbinary";

export function avatarsFor(gender: Gender | null | undefined): string[] {
  if (gender === "male") return MALE_AVATARS;
  if (gender === "nonbinary") return NONBINARY_AVATARS;
  return FEMALE_AVATARS;
}
