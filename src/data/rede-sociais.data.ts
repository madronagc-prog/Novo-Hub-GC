export interface RedesSociaisRegistro {
  mes: string;
  linkedin_seguidores: number | null;
  linkedin_crescimento: number | null;
  insta_seguidores: number | null;
  insta_crescimento: number | null;
  site_views: number | null;
  site_users: number | null;
  intra_views: number | null;
  intra_views_exclusivos: number | null;
}

export const redeSociaisData: RedesSociaisRegistro[] = [
  { mes: "Janeiro", linkedin_seguidores: 51487, linkedin_crescimento: 0.69, insta_seguidores: 3888, insta_crescimento: 0.0046, site_views: 14203, site_users: 7570, intra_views: 26101, intra_views_exclusivos: 268 },
  { mes: "Fevereiro", linkedin_seguidores: 51732, linkedin_crescimento: 0.48, insta_seguidores: 3904, insta_crescimento: 0.41, site_views: 10624, site_users: 5196, intra_views: 22665, intra_views_exclusivos: 270 },
  { mes: "Março", linkedin_seguidores: 52172, linkedin_crescimento: 0.85, insta_seguidores: 4096, insta_crescimento: 4.92, site_views: 16581, site_users: 6418, intra_views: 24713, intra_views_exclusivos: 275 },
  { mes: "Abril", linkedin_seguidores: 52396, linkedin_crescimento: 0.43, insta_seguidores: 4155, insta_crescimento: 1.44, site_views: 14611, site_users: 6677, intra_views: 23611, intra_views_exclusivos: 279 },
  { mes: "Maio", linkedin_seguidores: 52651, linkedin_crescimento: 0.49, insta_seguidores: 4220, insta_crescimento: 1.56, site_views: 14292, site_users: 7213, intra_views: 29441, intra_views_exclusivos: 308 },
  { mes: "Junho", linkedin_seguidores: 52854, linkedin_crescimento: 0.69, insta_seguidores: 4259, insta_crescimento: 0.92, site_views: 13131, site_users: 6520, intra_views: 21862, intra_views_exclusivos: 308 },
  { mes: "Julho", linkedin_seguidores: 53097, linkedin_crescimento: 0.45, insta_seguidores: 4273, insta_crescimento: 0.33, site_views: 14351, site_users: 7025, intra_views: 20080, intra_views_exclusivos: 333 },
  { mes: "Agosto", linkedin_seguidores: 53312, linkedin_crescimento: 0.4, insta_seguidores: 4333, insta_crescimento: 1.4, site_views: 16156, site_users: 7697, intra_views: 23711, intra_views_exclusivos: 323 },
  { mes: "Setembro", linkedin_seguidores: null, linkedin_crescimento: null, insta_seguidores: null, insta_crescimento: null, site_views: null, site_users: null, intra_views: null, intra_views_exclusivos: null },
  { mes: "Outubro", linkedin_seguidores: null, linkedin_crescimento: null, insta_seguidores: null, insta_crescimento: null, site_views: null, site_users: null, intra_views: null, intra_views_exclusivos: null },
  { mes: "Novembro", linkedin_seguidores: null, linkedin_crescimento: null, insta_seguidores: null, insta_crescimento: null, site_views: null, site_users: null, intra_views: null, intra_views_exclusivos: null },
  { mes: "Dezembro", linkedin_seguidores: null, linkedin_crescimento: null, insta_seguidores: null, insta_crescimento: null, site_views: null, site_users: null, intra_views: null, intra_views_exclusivos: null },
];
