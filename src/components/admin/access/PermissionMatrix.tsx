"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  ACTION_LABELS,
  ALL_ACTIONS,
  FEATURES as DEFAULT_FEATURES,
  FEATURE_GROUPS as DEFAULT_FEATURE_GROUPS,
  FeatureDef,
  PermissionAction,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface PermissionMatrixProps {
  value: string[];
  onChange: (next: string[]) => void;
  grantable?: string[];
  readOnly?: boolean;
  features?: FeatureDef[];
  featureGroups?: string[];
}

export function PermissionMatrix({
  value,
  onChange,
  grantable,
  readOnly,
  features = DEFAULT_FEATURES,
  featureGroups,
}: PermissionMatrixProps) {
  const groups = featureGroups || Array.from(new Set(features.map((f) => f.group)));
  const selected = new Set(value);
  const canGrant = (perm: string) => !grantable || grantable.includes(perm);

  const toggle = (featureKey: string, action: PermissionAction, checked: boolean) => {
    const next = new Set(selected);
    const perm = `${featureKey}.${action}`;
    const feature = features.find((f) => f.key === featureKey)!;

    if (checked) {
      next.add(perm);
      if (action !== "view" && feature.actions.includes("view") && canGrant(`${featureKey}.view`)) {
        next.add(`${featureKey}.view`);
      }
    } else {
      next.delete(perm);
      if (action === "view") {
        feature.actions.forEach((a) => next.delete(`${featureKey}.${a}`));
      }
    }
    onChange(Array.from(next));
  };

  const toggleRow = (featureKey: string, checked: boolean) => {
    const feature = features.find((f) => f.key === featureKey)!;
    const next = new Set(selected);
    feature.actions.forEach((a) => {
      const perm = `${featureKey}.${a}`;
      if (checked) {
        if (canGrant(perm)) next.add(perm);
      } else {
        next.delete(perm);
      }
    });
    onChange(Array.from(next));
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-semibold px-3 py-2 min-w-[200px]">Feature</th>
              {ALL_ACTIONS.map((a) => (
                <th key={a} className="px-2 py-2 text-center font-semibold w-20">
                  {ACTION_LABELS[a]}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold w-16">All</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupRows
                key={group}
                group={group}
                features={features.filter((f) => f.group === group)}
                selected={selected}
                canGrant={canGrant}
                readOnly={!!readOnly}
                toggle={toggle}
                toggleRow={toggleRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupRows({
  group,
  features,
  selected,
  canGrant,
  readOnly,
  toggle,
  toggleRow,
}: {
  group: string;
  features: FeatureDef[];
  selected: Set<string>;
  canGrant: (p: string) => boolean;
  readOnly: boolean;
  toggle: (feature: string, action: PermissionAction, checked: boolean) => void;
  toggleRow: (feature: string, checked: boolean) => void;
}) {
  return (
    <>
      <tr className="bg-muted/30">
        <td colSpan={ALL_ACTIONS.length + 2} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          {group}
        </td>
      </tr>
      {features.map((feature) => {
        const rowPerms = feature.actions.map((a) => `${feature.key}.${a}`);
        const allChecked = rowPerms.every((p) => selected.has(p));
        return (
          <tr key={feature.key} className="border-t">
            <td className="px-3 py-2">
              <div className="font-medium">{feature.label}</div>
              <div className="text-xs text-muted-foreground">{feature.description}</div>
            </td>
            {ALL_ACTIONS.map((action) => {
              const supported = feature.actions.includes(action);
              const perm = `${feature.key}.${action}`;
              return (
                <td key={action} className="text-center px-2 py-2">
                  {supported ? (
                    <Checkbox
                      checked={selected.has(perm)}
                      disabled={readOnly || !canGrant(perm)}
                      onCheckedChange={(c) => toggle(feature.key, action, c === true)}
                      aria-label={`${feature.label} ${action}`}
                      className={cn(!canGrant(perm) && "opacity-40")}
                    />
                  ) : (
                    <span className="text-muted-foreground/40">–</span>
                  )}
                </td>
              );
            })}
            <td className="text-center px-2 py-2">
              <Checkbox
                checked={allChecked}
                disabled={readOnly || rowPerms.some((p) => !canGrant(p))}
                onCheckedChange={(c) => toggleRow(feature.key, c === true)}
                aria-label={`${feature.label} all`}
              />
            </td>
          </tr>
        );
      })}
    </>
  );
}

