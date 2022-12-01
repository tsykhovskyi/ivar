redis.debug(tonumber(nil))

local key1 = KEYS[1]
local arg1 = ARGV[1]
local arg2 = ARGV[2]

local ENV = 5;

local t_members = {};
local function concat_table(t)
   local res = ''
   for _, v in pairs(t) do
      res = res .. v
   end
   return res
end

local res = concat_table(t_members)

redis.call('del', "myhash")

--local concat = key1..arg1..arg2;
return (key1 or 'nil') .. ":" .. (arg1 or 'nil') .. ":" .. (arg2 or 'nil')