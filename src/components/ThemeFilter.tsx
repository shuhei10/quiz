import * as React from "react";
import { Box, Chip, Stack, Typography, Button } from "@mui/material";
import type { Theme } from "../lib/questionsApi";

type Props = {
  themes: Theme[];
  selectedSlugs: string[];
  onChange: (next: string[]) => void;
};

export default function ThemeFilter({ themes, selectedSlugs, onChange }: Props) {
  const ordered = React.useMemo(
    () => [...themes].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [themes],
  );

  const toggle = (slug: string) => {
    const has = selectedSlugs.includes(slug);
    onChange(has ? selectedSlugs.filter((s) => s !== slug) : [...selectedSlugs, slug]);
  };

  const selectAll = () =>
    onChange(ordered.map((t) => t.slug).filter((s): s is string => !!s));

  const clear = () => onChange([]);

  const usableCount = ordered.filter((t) => !!t.slug).length;

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 800 }}>章フィルタ</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={selectAll}>
            全選択
          </Button>
          <Button size="small" onClick={clear}>
            解除
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {ordered.map((t) => {
          const slug = t.slug ?? "";
          const active = slug && selectedSlugs.includes(slug);
          return (
            <Chip
              key={`${t.grade}-${t.chapter_id}`}
              label={t.title ?? "(no title)"}
              clickable={!!slug}
              onClick={() => slug && toggle(slug)}
              color={active ? "primary" : "default"}
              variant={active ? "filled" : "outlined"}
              sx={{ borderRadius: 2, opacity: slug ? 1 : 0.5 }}
            />
          );
        })}
      </Stack>

      <Typography sx={{ mt: 1, fontSize: 12, opacity: 0.75 }}>
        選択中：{selectedSlugs.length} / {usableCount}
        {selectedSlugs.length === 0 ? "（未選択=全章）" : ""}
      </Typography>
    </Box>
  );
}