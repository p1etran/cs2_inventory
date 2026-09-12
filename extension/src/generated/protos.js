/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const CMsgProtoBufHeader = $root.CMsgProtoBufHeader = (() => {

    function CMsgProtoBufHeader(properties) {
        this.forward_to_sysid = [];
        this.exclude_client_sessionids = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgProtoBufHeader.prototype.steamid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgProtoBufHeader.prototype.client_sessionid = 0;
    CMsgProtoBufHeader.prototype.routing_appid = 0;
    CMsgProtoBufHeader.prototype.jobid_source = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgProtoBufHeader.prototype.jobid_target = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgProtoBufHeader.prototype.target_job_name = "";
    CMsgProtoBufHeader.prototype.eresult = 2;
    CMsgProtoBufHeader.prototype.error_message = "";
    CMsgProtoBufHeader.prototype.ip = 0;
    CMsgProtoBufHeader.prototype.auth_account_flags = 0;
    CMsgProtoBufHeader.prototype.transport_error = 1;
    CMsgProtoBufHeader.prototype.messageid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgProtoBufHeader.prototype.publisher_group_id = 0;
    CMsgProtoBufHeader.prototype.sysid = 0;
    CMsgProtoBufHeader.prototype.trace_tag = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgProtoBufHeader.prototype.token_source = 0;
    CMsgProtoBufHeader.prototype.admin_spoofing_user = false;
    CMsgProtoBufHeader.prototype.seq_num = 0;
    CMsgProtoBufHeader.prototype.webapi_key_id = 0;
    CMsgProtoBufHeader.prototype.is_from_external_source = false;
    CMsgProtoBufHeader.prototype.forward_to_sysid = $util.emptyArray;
    CMsgProtoBufHeader.prototype.cm_sysid = 0;
    CMsgProtoBufHeader.prototype.ip_v6 = $util.newBuffer([]);
    CMsgProtoBufHeader.prototype.wg_token = "";
    CMsgProtoBufHeader.prototype.launcher_type = 0;
    CMsgProtoBufHeader.prototype.realm = 0;
    CMsgProtoBufHeader.prototype.timeout_ms = -1;
    CMsgProtoBufHeader.prototype.debug_source = "";
    CMsgProtoBufHeader.prototype.debug_source_string_index = 0;
    CMsgProtoBufHeader.prototype.token_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgProtoBufHeader.prototype.routing_gc = null;
    CMsgProtoBufHeader.prototype.session_disposition = 0;
    CMsgProtoBufHeader.prototype.wg_token__field_39 = "";
    CMsgProtoBufHeader.prototype.webui_auth_key = "";
    CMsgProtoBufHeader.prototype.exclude_client_sessionids = $util.emptyArray;

    CMsgProtoBufHeader.create = function create(properties) {
        return new CMsgProtoBufHeader(properties);
    };

    CMsgProtoBufHeader.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.steamid != null && Object.hasOwnProperty.call(message, "steamid"))
            writer.uint32(9).fixed64(message.steamid);
        if (message.client_sessionid != null && Object.hasOwnProperty.call(message, "client_sessionid"))
            writer.uint32(16).int32(message.client_sessionid);
        if (message.routing_appid != null && Object.hasOwnProperty.call(message, "routing_appid"))
            writer.uint32(24).uint32(message.routing_appid);
        if (message.jobid_source != null && Object.hasOwnProperty.call(message, "jobid_source"))
            writer.uint32(81).fixed64(message.jobid_source);
        if (message.jobid_target != null && Object.hasOwnProperty.call(message, "jobid_target"))
            writer.uint32(89).fixed64(message.jobid_target);
        if (message.target_job_name != null && Object.hasOwnProperty.call(message, "target_job_name"))
            writer.uint32(98).string(message.target_job_name);
        if (message.eresult != null && Object.hasOwnProperty.call(message, "eresult"))
            writer.uint32(104).int32(message.eresult);
        if (message.error_message != null && Object.hasOwnProperty.call(message, "error_message"))
            writer.uint32(114).string(message.error_message);
        if (message.ip != null && Object.hasOwnProperty.call(message, "ip"))
            writer.uint32(120).uint32(message.ip);
        if (message.auth_account_flags != null && Object.hasOwnProperty.call(message, "auth_account_flags"))
            writer.uint32(128).uint32(message.auth_account_flags);
        if (message.transport_error != null && Object.hasOwnProperty.call(message, "transport_error"))
            writer.uint32(136).int32(message.transport_error);
        if (message.messageid != null && Object.hasOwnProperty.call(message, "messageid"))
            writer.uint32(144).uint64(message.messageid);
        if (message.publisher_group_id != null && Object.hasOwnProperty.call(message, "publisher_group_id"))
            writer.uint32(152).uint32(message.publisher_group_id);
        if (message.sysid != null && Object.hasOwnProperty.call(message, "sysid"))
            writer.uint32(160).uint32(message.sysid);
        if (message.trace_tag != null && Object.hasOwnProperty.call(message, "trace_tag"))
            writer.uint32(168).uint64(message.trace_tag);
        if (message.token_source != null && Object.hasOwnProperty.call(message, "token_source"))
            writer.uint32(176).uint32(message.token_source);
        if (message.admin_spoofing_user != null && Object.hasOwnProperty.call(message, "admin_spoofing_user"))
            writer.uint32(184).bool(message.admin_spoofing_user);
        if (message.seq_num != null && Object.hasOwnProperty.call(message, "seq_num"))
            writer.uint32(192).int32(message.seq_num);
        if (message.webapi_key_id != null && Object.hasOwnProperty.call(message, "webapi_key_id"))
            writer.uint32(200).uint32(message.webapi_key_id);
        if (message.is_from_external_source != null && Object.hasOwnProperty.call(message, "is_from_external_source"))
            writer.uint32(208).bool(message.is_from_external_source);
        if (message.forward_to_sysid != null && message.forward_to_sysid.length)
            for (let i = 0; i < message.forward_to_sysid.length; ++i)
                writer.uint32(216).uint32(message.forward_to_sysid[i]);
        if (message.cm_sysid != null && Object.hasOwnProperty.call(message, "cm_sysid"))
            writer.uint32(224).uint32(message.cm_sysid);
        if (message.ip_v6 != null && Object.hasOwnProperty.call(message, "ip_v6"))
            writer.uint32(234).bytes(message.ip_v6);
        if (message.wg_token != null && Object.hasOwnProperty.call(message, "wg_token"))
            writer.uint32(242).string(message.wg_token);
        if (message.launcher_type != null && Object.hasOwnProperty.call(message, "launcher_type"))
            writer.uint32(248).uint32(message.launcher_type);
        if (message.realm != null && Object.hasOwnProperty.call(message, "realm"))
            writer.uint32(256).uint32(message.realm);
        if (message.timeout_ms != null && Object.hasOwnProperty.call(message, "timeout_ms"))
            writer.uint32(264).int32(message.timeout_ms);
        if (message.debug_source != null && Object.hasOwnProperty.call(message, "debug_source"))
            writer.uint32(274).string(message.debug_source);
        if (message.debug_source_string_index != null && Object.hasOwnProperty.call(message, "debug_source_string_index"))
            writer.uint32(280).uint32(message.debug_source_string_index);
        if (message.token_id != null && Object.hasOwnProperty.call(message, "token_id"))
            writer.uint32(288).uint64(message.token_id);
        if (message.routing_gc != null && Object.hasOwnProperty.call(message, "routing_gc"))
            $root.CMsgGCRoutingProtoBufHeader.encode(message.routing_gc, writer.uint32(298).fork(), q + 1).ldelim();
        if (message.session_disposition != null && Object.hasOwnProperty.call(message, "session_disposition"))
            writer.uint32(304).int32(message.session_disposition);
        if (message.wg_token__field_39 != null && Object.hasOwnProperty.call(message, "wg_token__field_39"))
            writer.uint32(314).string(message.wg_token__field_39);
        if (message.webui_auth_key != null && Object.hasOwnProperty.call(message, "webui_auth_key"))
            writer.uint32(322).string(message.webui_auth_key);
        if (message.exclude_client_sessionids != null && message.exclude_client_sessionids.length)
            for (let i = 0; i < message.exclude_client_sessionids.length; ++i)
                writer.uint32(328).int32(message.exclude_client_sessionids[i]);
        return writer;
    };

    CMsgProtoBufHeader.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgProtoBufHeader();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.steamid = reader.fixed64();
                    break;
                }
            case 2: {
                    message.client_sessionid = reader.int32();
                    break;
                }
            case 3: {
                    message.routing_appid = reader.uint32();
                    break;
                }
            case 10: {
                    message.jobid_source = reader.fixed64();
                    break;
                }
            case 11: {
                    message.jobid_target = reader.fixed64();
                    break;
                }
            case 12: {
                    message.target_job_name = reader.string();
                    break;
                }
            case 13: {
                    message.eresult = reader.int32();
                    break;
                }
            case 14: {
                    message.error_message = reader.string();
                    break;
                }
            case 15: {
                    message.ip = reader.uint32();
                    break;
                }
            case 16: {
                    message.auth_account_flags = reader.uint32();
                    break;
                }
            case 17: {
                    message.transport_error = reader.int32();
                    break;
                }
            case 18: {
                    message.messageid = reader.uint64();
                    break;
                }
            case 19: {
                    message.publisher_group_id = reader.uint32();
                    break;
                }
            case 20: {
                    message.sysid = reader.uint32();
                    break;
                }
            case 21: {
                    message.trace_tag = reader.uint64();
                    break;
                }
            case 22: {
                    message.token_source = reader.uint32();
                    break;
                }
            case 23: {
                    message.admin_spoofing_user = reader.bool();
                    break;
                }
            case 24: {
                    message.seq_num = reader.int32();
                    break;
                }
            case 25: {
                    message.webapi_key_id = reader.uint32();
                    break;
                }
            case 26: {
                    message.is_from_external_source = reader.bool();
                    break;
                }
            case 27: {
                    if (!(message.forward_to_sysid && message.forward_to_sysid.length))
                        message.forward_to_sysid = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        if (end2 > reader.len)
                            throw RangeError("index out of range");
                        reader.len = end2;
                        while (reader.pos < end2)
                            message.forward_to_sysid.push(reader.uint32());
                        if (reader.pos !== end2)
                            throw RangeError("index out of range");
                        reader.len = end;
                    } else
                        message.forward_to_sysid.push(reader.uint32());
                    break;
                }
            case 28: {
                    message.cm_sysid = reader.uint32();
                    break;
                }
            case 29: {
                    message.ip_v6 = reader.bytes();
                    break;
                }
            case 30: {
                    message.wg_token = reader.string();
                    break;
                }
            case 31: {
                    message.launcher_type = reader.uint32();
                    break;
                }
            case 32: {
                    message.realm = reader.uint32();
                    break;
                }
            case 33: {
                    message.timeout_ms = reader.int32();
                    break;
                }
            case 34: {
                    message.debug_source = reader.string();
                    break;
                }
            case 35: {
                    message.debug_source_string_index = reader.uint32();
                    break;
                }
            case 36: {
                    message.token_id = reader.uint64();
                    break;
                }
            case 37: {
                    message.routing_gc = $root.CMsgGCRoutingProtoBufHeader.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            case 38: {
                    message.session_disposition = reader.int32();
                    break;
                }
            case 39: {
                    message.wg_token__field_39 = reader.string();
                    break;
                }
            case 40: {
                    message.webui_auth_key = reader.string();
                    break;
                }
            case 41: {
                    if (!(message.exclude_client_sessionids && message.exclude_client_sessionids.length))
                        message.exclude_client_sessionids = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        if (end2 > reader.len)
                            throw RangeError("index out of range");
                        reader.len = end2;
                        while (reader.pos < end2)
                            message.exclude_client_sessionids.push(reader.int32());
                        if (reader.pos !== end2)
                            throw RangeError("index out of range");
                        reader.len = end;
                    } else
                        message.exclude_client_sessionids.push(reader.int32());
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgProtoBufHeader.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgProtoBufHeader)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgProtoBufHeader: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgProtoBufHeader();
        if (object.steamid != null)
            if ($util.Long)
                message.steamid = $util.Long.fromValue(object.steamid, true);
            else if (typeof object.steamid === "string")
                message.steamid = parseInt(object.steamid, 10);
            else if (typeof object.steamid === "number")
                message.steamid = object.steamid;
            else if (typeof object.steamid === "object")
                message.steamid = new $util.LongBits(object.steamid.low >>> 0, object.steamid.high >>> 0).toNumber(true);
        if (object.client_sessionid != null)
            message.client_sessionid = object.client_sessionid | 0;
        if (object.routing_appid != null)
            message.routing_appid = object.routing_appid >>> 0;
        if (object.jobid_source != null)
            if ($util.Long)
                message.jobid_source = $util.Long.fromValue(object.jobid_source, true);
            else if (typeof object.jobid_source === "string")
                message.jobid_source = parseInt(object.jobid_source, 10);
            else if (typeof object.jobid_source === "number")
                message.jobid_source = object.jobid_source;
            else if (typeof object.jobid_source === "object")
                message.jobid_source = new $util.LongBits(object.jobid_source.low >>> 0, object.jobid_source.high >>> 0).toNumber(true);
        if (object.jobid_target != null)
            if ($util.Long)
                message.jobid_target = $util.Long.fromValue(object.jobid_target, true);
            else if (typeof object.jobid_target === "string")
                message.jobid_target = parseInt(object.jobid_target, 10);
            else if (typeof object.jobid_target === "number")
                message.jobid_target = object.jobid_target;
            else if (typeof object.jobid_target === "object")
                message.jobid_target = new $util.LongBits(object.jobid_target.low >>> 0, object.jobid_target.high >>> 0).toNumber(true);
        if (object.target_job_name != null)
            message.target_job_name = String(object.target_job_name);
        if (object.eresult != null)
            message.eresult = object.eresult | 0;
        if (object.error_message != null)
            message.error_message = String(object.error_message);
        if (object.ip != null)
            message.ip = object.ip >>> 0;
        if (object.auth_account_flags != null)
            message.auth_account_flags = object.auth_account_flags >>> 0;
        if (object.transport_error != null)
            message.transport_error = object.transport_error | 0;
        if (object.messageid != null)
            if ($util.Long)
                message.messageid = $util.Long.fromValue(object.messageid, true);
            else if (typeof object.messageid === "string")
                message.messageid = parseInt(object.messageid, 10);
            else if (typeof object.messageid === "number")
                message.messageid = object.messageid;
            else if (typeof object.messageid === "object")
                message.messageid = new $util.LongBits(object.messageid.low >>> 0, object.messageid.high >>> 0).toNumber(true);
        if (object.publisher_group_id != null)
            message.publisher_group_id = object.publisher_group_id >>> 0;
        if (object.sysid != null)
            message.sysid = object.sysid >>> 0;
        if (object.trace_tag != null)
            if ($util.Long)
                message.trace_tag = $util.Long.fromValue(object.trace_tag, true);
            else if (typeof object.trace_tag === "string")
                message.trace_tag = parseInt(object.trace_tag, 10);
            else if (typeof object.trace_tag === "number")
                message.trace_tag = object.trace_tag;
            else if (typeof object.trace_tag === "object")
                message.trace_tag = new $util.LongBits(object.trace_tag.low >>> 0, object.trace_tag.high >>> 0).toNumber(true);
        if (object.token_source != null)
            message.token_source = object.token_source >>> 0;
        if (object.admin_spoofing_user != null)
            message.admin_spoofing_user = Boolean(object.admin_spoofing_user);
        if (object.seq_num != null)
            message.seq_num = object.seq_num | 0;
        if (object.webapi_key_id != null)
            message.webapi_key_id = object.webapi_key_id >>> 0;
        if (object.is_from_external_source != null)
            message.is_from_external_source = Boolean(object.is_from_external_source);
        if (object.forward_to_sysid) {
            if (!Array.isArray(object.forward_to_sysid))
                throw TypeError(".CMsgProtoBufHeader.forward_to_sysid: array expected");
            message.forward_to_sysid = [];
            for (let i = 0; i < object.forward_to_sysid.length; ++i)
                message.forward_to_sysid[i] = object.forward_to_sysid[i] >>> 0;
        }
        if (object.cm_sysid != null)
            message.cm_sysid = object.cm_sysid >>> 0;
        if (object.ip_v6 != null)
            if (typeof object.ip_v6 === "string")
                $util.base64.decode(object.ip_v6, message.ip_v6 = $util.newBuffer($util.base64.length(object.ip_v6)), 0);
            else if (object.ip_v6.length >= 0)
                message.ip_v6 = object.ip_v6;
        if (object.wg_token != null)
            message.wg_token = String(object.wg_token);
        if (object.launcher_type != null)
            message.launcher_type = object.launcher_type >>> 0;
        if (object.realm != null)
            message.realm = object.realm >>> 0;
        if (object.timeout_ms != null)
            message.timeout_ms = object.timeout_ms | 0;
        if (object.debug_source != null)
            message.debug_source = String(object.debug_source);
        if (object.debug_source_string_index != null)
            message.debug_source_string_index = object.debug_source_string_index >>> 0;
        if (object.token_id != null)
            if ($util.Long)
                message.token_id = $util.Long.fromValue(object.token_id, true);
            else if (typeof object.token_id === "string")
                message.token_id = parseInt(object.token_id, 10);
            else if (typeof object.token_id === "number")
                message.token_id = object.token_id;
            else if (typeof object.token_id === "object")
                message.token_id = new $util.LongBits(object.token_id.low >>> 0, object.token_id.high >>> 0).toNumber(true);
        if (object.routing_gc != null) {
            if (!$util.isObject(object.routing_gc))
                throw TypeError(".CMsgProtoBufHeader.routing_gc: object expected");
            message.routing_gc = $root.CMsgGCRoutingProtoBufHeader.fromObject(object.routing_gc, long + 1);
        }
        if (object.session_disposition != null)
            message.session_disposition = object.session_disposition | 0;
        if (object.wg_token__field_39 != null)
            message.wg_token__field_39 = String(object.wg_token__field_39);
        if (object.webui_auth_key != null)
            message.webui_auth_key = String(object.webui_auth_key);
        if (object.exclude_client_sessionids) {
            if (!Array.isArray(object.exclude_client_sessionids))
                throw TypeError(".CMsgProtoBufHeader.exclude_client_sessionids: array expected");
            message.exclude_client_sessionids = [];
            for (let i = 0; i < object.exclude_client_sessionids.length; ++i)
                message.exclude_client_sessionids[i] = object.exclude_client_sessionids[i] | 0;
        }
        return message;
    };

    CMsgProtoBufHeader.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.arrays || options.defaults) {
            object.forward_to_sysid = [];
            object.exclude_client_sessionids = [];
        }
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.steamid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.steamid = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.client_sessionid = 0;
            object.routing_appid = 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.jobid_source = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.jobid_source = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.jobid_target = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.jobid_target = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.target_job_name = "";
            object.eresult = 2;
            object.error_message = "";
            object.ip = 0;
            object.auth_account_flags = 0;
            object.transport_error = 1;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.messageid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.messageid = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.publisher_group_id = 0;
            object.sysid = 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.trace_tag = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.trace_tag = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.token_source = 0;
            object.admin_spoofing_user = false;
            object.seq_num = 0;
            object.webapi_key_id = 0;
            object.is_from_external_source = false;
            object.cm_sysid = 0;
            if (options.bytes === String)
                object.ip_v6 = "";
            else {
                object.ip_v6 = [];
                if (options.bytes !== Array)
                    object.ip_v6 = $util.newBuffer(object.ip_v6);
            }
            object.wg_token = "";
            object.launcher_type = 0;
            object.realm = 0;
            object.timeout_ms = -1;
            object.debug_source = "";
            object.debug_source_string_index = 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.token_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.token_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.routing_gc = null;
            object.session_disposition = 0;
            object.wg_token__field_39 = "";
            object.webui_auth_key = "";
        }
        if (message.steamid != null && Object.hasOwnProperty.call(message, "steamid"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.steamid = typeof message.steamid === "number" ? BigInt(message.steamid) : $util.Long.fromBits(message.steamid.low >>> 0, message.steamid.high >>> 0, true).toBigInt();
            else if (typeof message.steamid === "number")
                object.steamid = options.longs === String ? String(message.steamid) : message.steamid;
            else
                object.steamid = options.longs === String ? $util.Long.prototype.toString.call(message.steamid) : options.longs === Number ? new $util.LongBits(message.steamid.low >>> 0, message.steamid.high >>> 0).toNumber(true) : message.steamid;
        if (message.client_sessionid != null && Object.hasOwnProperty.call(message, "client_sessionid"))
            object.client_sessionid = message.client_sessionid;
        if (message.routing_appid != null && Object.hasOwnProperty.call(message, "routing_appid"))
            object.routing_appid = message.routing_appid;
        if (message.jobid_source != null && Object.hasOwnProperty.call(message, "jobid_source"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.jobid_source = typeof message.jobid_source === "number" ? BigInt(message.jobid_source) : $util.Long.fromBits(message.jobid_source.low >>> 0, message.jobid_source.high >>> 0, true).toBigInt();
            else if (typeof message.jobid_source === "number")
                object.jobid_source = options.longs === String ? String(message.jobid_source) : message.jobid_source;
            else
                object.jobid_source = options.longs === String ? $util.Long.prototype.toString.call(message.jobid_source) : options.longs === Number ? new $util.LongBits(message.jobid_source.low >>> 0, message.jobid_source.high >>> 0).toNumber(true) : message.jobid_source;
        if (message.jobid_target != null && Object.hasOwnProperty.call(message, "jobid_target"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.jobid_target = typeof message.jobid_target === "number" ? BigInt(message.jobid_target) : $util.Long.fromBits(message.jobid_target.low >>> 0, message.jobid_target.high >>> 0, true).toBigInt();
            else if (typeof message.jobid_target === "number")
                object.jobid_target = options.longs === String ? String(message.jobid_target) : message.jobid_target;
            else
                object.jobid_target = options.longs === String ? $util.Long.prototype.toString.call(message.jobid_target) : options.longs === Number ? new $util.LongBits(message.jobid_target.low >>> 0, message.jobid_target.high >>> 0).toNumber(true) : message.jobid_target;
        if (message.target_job_name != null && Object.hasOwnProperty.call(message, "target_job_name"))
            object.target_job_name = message.target_job_name;
        if (message.eresult != null && Object.hasOwnProperty.call(message, "eresult"))
            object.eresult = message.eresult;
        if (message.error_message != null && Object.hasOwnProperty.call(message, "error_message"))
            object.error_message = message.error_message;
        if (message.ip != null && Object.hasOwnProperty.call(message, "ip"))
            object.ip = message.ip;
        if (message.auth_account_flags != null && Object.hasOwnProperty.call(message, "auth_account_flags"))
            object.auth_account_flags = message.auth_account_flags;
        if (message.transport_error != null && Object.hasOwnProperty.call(message, "transport_error"))
            object.transport_error = message.transport_error;
        if (message.messageid != null && Object.hasOwnProperty.call(message, "messageid"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.messageid = typeof message.messageid === "number" ? BigInt(message.messageid) : $util.Long.fromBits(message.messageid.low >>> 0, message.messageid.high >>> 0, true).toBigInt();
            else if (typeof message.messageid === "number")
                object.messageid = options.longs === String ? String(message.messageid) : message.messageid;
            else
                object.messageid = options.longs === String ? $util.Long.prototype.toString.call(message.messageid) : options.longs === Number ? new $util.LongBits(message.messageid.low >>> 0, message.messageid.high >>> 0).toNumber(true) : message.messageid;
        if (message.publisher_group_id != null && Object.hasOwnProperty.call(message, "publisher_group_id"))
            object.publisher_group_id = message.publisher_group_id;
        if (message.sysid != null && Object.hasOwnProperty.call(message, "sysid"))
            object.sysid = message.sysid;
        if (message.trace_tag != null && Object.hasOwnProperty.call(message, "trace_tag"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.trace_tag = typeof message.trace_tag === "number" ? BigInt(message.trace_tag) : $util.Long.fromBits(message.trace_tag.low >>> 0, message.trace_tag.high >>> 0, true).toBigInt();
            else if (typeof message.trace_tag === "number")
                object.trace_tag = options.longs === String ? String(message.trace_tag) : message.trace_tag;
            else
                object.trace_tag = options.longs === String ? $util.Long.prototype.toString.call(message.trace_tag) : options.longs === Number ? new $util.LongBits(message.trace_tag.low >>> 0, message.trace_tag.high >>> 0).toNumber(true) : message.trace_tag;
        if (message.token_source != null && Object.hasOwnProperty.call(message, "token_source"))
            object.token_source = message.token_source;
        if (message.admin_spoofing_user != null && Object.hasOwnProperty.call(message, "admin_spoofing_user"))
            object.admin_spoofing_user = message.admin_spoofing_user;
        if (message.seq_num != null && Object.hasOwnProperty.call(message, "seq_num"))
            object.seq_num = message.seq_num;
        if (message.webapi_key_id != null && Object.hasOwnProperty.call(message, "webapi_key_id"))
            object.webapi_key_id = message.webapi_key_id;
        if (message.is_from_external_source != null && Object.hasOwnProperty.call(message, "is_from_external_source"))
            object.is_from_external_source = message.is_from_external_source;
        if (message.forward_to_sysid && message.forward_to_sysid.length) {
            object.forward_to_sysid = [];
            for (let j = 0; j < message.forward_to_sysid.length; ++j)
                object.forward_to_sysid[j] = message.forward_to_sysid[j];
        }
        if (message.cm_sysid != null && Object.hasOwnProperty.call(message, "cm_sysid"))
            object.cm_sysid = message.cm_sysid;
        if (message.ip_v6 != null && Object.hasOwnProperty.call(message, "ip_v6"))
            object.ip_v6 = options.bytes === String ? $util.base64.encode(message.ip_v6, 0, message.ip_v6.length) : options.bytes === Array ? Array.prototype.slice.call(message.ip_v6) : message.ip_v6;
        if (message.wg_token != null && Object.hasOwnProperty.call(message, "wg_token"))
            object.wg_token = message.wg_token;
        if (message.launcher_type != null && Object.hasOwnProperty.call(message, "launcher_type"))
            object.launcher_type = message.launcher_type;
        if (message.realm != null && Object.hasOwnProperty.call(message, "realm"))
            object.realm = message.realm;
        if (message.timeout_ms != null && Object.hasOwnProperty.call(message, "timeout_ms"))
            object.timeout_ms = message.timeout_ms;
        if (message.debug_source != null && Object.hasOwnProperty.call(message, "debug_source"))
            object.debug_source = message.debug_source;
        if (message.debug_source_string_index != null && Object.hasOwnProperty.call(message, "debug_source_string_index"))
            object.debug_source_string_index = message.debug_source_string_index;
        if (message.token_id != null && Object.hasOwnProperty.call(message, "token_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.token_id = typeof message.token_id === "number" ? BigInt(message.token_id) : $util.Long.fromBits(message.token_id.low >>> 0, message.token_id.high >>> 0, true).toBigInt();
            else if (typeof message.token_id === "number")
                object.token_id = options.longs === String ? String(message.token_id) : message.token_id;
            else
                object.token_id = options.longs === String ? $util.Long.prototype.toString.call(message.token_id) : options.longs === Number ? new $util.LongBits(message.token_id.low >>> 0, message.token_id.high >>> 0).toNumber(true) : message.token_id;
        if (message.routing_gc != null && Object.hasOwnProperty.call(message, "routing_gc"))
            object.routing_gc = $root.CMsgGCRoutingProtoBufHeader.toObject(message.routing_gc, options, q + 1);
        if (message.session_disposition != null && Object.hasOwnProperty.call(message, "session_disposition"))
            object.session_disposition = message.session_disposition;
        if (message.wg_token__field_39 != null && Object.hasOwnProperty.call(message, "wg_token__field_39"))
            object.wg_token__field_39 = message.wg_token__field_39;
        if (message.webui_auth_key != null && Object.hasOwnProperty.call(message, "webui_auth_key"))
            object.webui_auth_key = message.webui_auth_key;
        if (message.exclude_client_sessionids && message.exclude_client_sessionids.length) {
            object.exclude_client_sessionids = [];
            for (let j = 0; j < message.exclude_client_sessionids.length; ++j)
                object.exclude_client_sessionids[j] = message.exclude_client_sessionids[j];
        }
        return object;
    };

    CMsgProtoBufHeader.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgProtoBufHeader.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgProtoBufHeader";
    };

    return CMsgProtoBufHeader;
})();

export const CMsgGCRoutingProtoBufHeader = $root.CMsgGCRoutingProtoBufHeader = (() => {

    function CMsgGCRoutingProtoBufHeader(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgGCRoutingProtoBufHeader.prototype.dst_gcid_queue = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgGCRoutingProtoBufHeader.prototype.dst_gc_dir_index = 0;

    CMsgGCRoutingProtoBufHeader.create = function create(properties) {
        return new CMsgGCRoutingProtoBufHeader(properties);
    };

    CMsgGCRoutingProtoBufHeader.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.dst_gcid_queue != null && Object.hasOwnProperty.call(message, "dst_gcid_queue"))
            writer.uint32(8).uint64(message.dst_gcid_queue);
        if (message.dst_gc_dir_index != null && Object.hasOwnProperty.call(message, "dst_gc_dir_index"))
            writer.uint32(16).uint32(message.dst_gc_dir_index);
        return writer;
    };

    CMsgGCRoutingProtoBufHeader.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgGCRoutingProtoBufHeader();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.dst_gcid_queue = reader.uint64();
                    break;
                }
            case 2: {
                    message.dst_gc_dir_index = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgGCRoutingProtoBufHeader.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgGCRoutingProtoBufHeader)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgGCRoutingProtoBufHeader: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgGCRoutingProtoBufHeader();
        if (object.dst_gcid_queue != null)
            if ($util.Long)
                message.dst_gcid_queue = $util.Long.fromValue(object.dst_gcid_queue, true);
            else if (typeof object.dst_gcid_queue === "string")
                message.dst_gcid_queue = parseInt(object.dst_gcid_queue, 10);
            else if (typeof object.dst_gcid_queue === "number")
                message.dst_gcid_queue = object.dst_gcid_queue;
            else if (typeof object.dst_gcid_queue === "object")
                message.dst_gcid_queue = new $util.LongBits(object.dst_gcid_queue.low >>> 0, object.dst_gcid_queue.high >>> 0).toNumber(true);
        if (object.dst_gc_dir_index != null)
            message.dst_gc_dir_index = object.dst_gc_dir_index >>> 0;
        return message;
    };

    CMsgGCRoutingProtoBufHeader.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.dst_gcid_queue = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.dst_gcid_queue = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.dst_gc_dir_index = 0;
        }
        if (message.dst_gcid_queue != null && Object.hasOwnProperty.call(message, "dst_gcid_queue"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.dst_gcid_queue = typeof message.dst_gcid_queue === "number" ? BigInt(message.dst_gcid_queue) : $util.Long.fromBits(message.dst_gcid_queue.low >>> 0, message.dst_gcid_queue.high >>> 0, true).toBigInt();
            else if (typeof message.dst_gcid_queue === "number")
                object.dst_gcid_queue = options.longs === String ? String(message.dst_gcid_queue) : message.dst_gcid_queue;
            else
                object.dst_gcid_queue = options.longs === String ? $util.Long.prototype.toString.call(message.dst_gcid_queue) : options.longs === Number ? new $util.LongBits(message.dst_gcid_queue.low >>> 0, message.dst_gcid_queue.high >>> 0).toNumber(true) : message.dst_gcid_queue;
        if (message.dst_gc_dir_index != null && Object.hasOwnProperty.call(message, "dst_gc_dir_index"))
            object.dst_gc_dir_index = message.dst_gc_dir_index;
        return object;
    };

    CMsgGCRoutingProtoBufHeader.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgGCRoutingProtoBufHeader.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgGCRoutingProtoBufHeader";
    };

    return CMsgGCRoutingProtoBufHeader;
})();

export const CMsgMulti = $root.CMsgMulti = (() => {

    function CMsgMulti(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgMulti.prototype.size_unzipped = 0;
    CMsgMulti.prototype.message_body = $util.newBuffer([]);

    CMsgMulti.create = function create(properties) {
        return new CMsgMulti(properties);
    };

    CMsgMulti.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.size_unzipped != null && Object.hasOwnProperty.call(message, "size_unzipped"))
            writer.uint32(8).uint32(message.size_unzipped);
        if (message.message_body != null && Object.hasOwnProperty.call(message, "message_body"))
            writer.uint32(18).bytes(message.message_body);
        return writer;
    };

    CMsgMulti.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgMulti();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.size_unzipped = reader.uint32();
                    break;
                }
            case 2: {
                    message.message_body = reader.bytes();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgMulti.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgMulti)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgMulti: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgMulti();
        if (object.size_unzipped != null)
            message.size_unzipped = object.size_unzipped >>> 0;
        if (object.message_body != null)
            if (typeof object.message_body === "string")
                $util.base64.decode(object.message_body, message.message_body = $util.newBuffer($util.base64.length(object.message_body)), 0);
            else if (object.message_body.length >= 0)
                message.message_body = object.message_body;
        return message;
    };

    CMsgMulti.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.size_unzipped = 0;
            if (options.bytes === String)
                object.message_body = "";
            else {
                object.message_body = [];
                if (options.bytes !== Array)
                    object.message_body = $util.newBuffer(object.message_body);
            }
        }
        if (message.size_unzipped != null && Object.hasOwnProperty.call(message, "size_unzipped"))
            object.size_unzipped = message.size_unzipped;
        if (message.message_body != null && Object.hasOwnProperty.call(message, "message_body"))
            object.message_body = options.bytes === String ? $util.base64.encode(message.message_body, 0, message.message_body.length) : options.bytes === Array ? Array.prototype.slice.call(message.message_body) : message.message_body;
        return object;
    };

    CMsgMulti.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgMulti.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgMulti";
    };

    return CMsgMulti;
})();

export const CMsgClientLogon = $root.CMsgClientLogon = (() => {

    function CMsgClientLogon(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientLogon.prototype.protocol_version = 0;
    CMsgClientLogon.prototype.deprecated_obfustucated_private_ip = 0;
    CMsgClientLogon.prototype.cell_id = 0;
    CMsgClientLogon.prototype.last_session_id = 0;
    CMsgClientLogon.prototype.client_package_version = 0;
    CMsgClientLogon.prototype.client_language = "";
    CMsgClientLogon.prototype.client_os_type = 0;
    CMsgClientLogon.prototype.should_remember_password = false;
    CMsgClientLogon.prototype.wine_version = "";
    CMsgClientLogon.prototype.deprecated_10 = 0;
    CMsgClientLogon.prototype.obfuscated_private_ip = null;
    CMsgClientLogon.prototype.deprecated_public_ip = 0;
    CMsgClientLogon.prototype.qos_level = 0;
    CMsgClientLogon.prototype.client_supplied_steam_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientLogon.prototype.public_ip = null;
    CMsgClientLogon.prototype.machine_id = $util.newBuffer([]);
    CMsgClientLogon.prototype.launcher_type = 0;
    CMsgClientLogon.prototype.ui_mode = 0;
    CMsgClientLogon.prototype.chat_mode = 0;
    CMsgClientLogon.prototype.steam2_auth_ticket = $util.newBuffer([]);
    CMsgClientLogon.prototype.email_address = "";
    CMsgClientLogon.prototype.rtime32_account_creation = 0;
    CMsgClientLogon.prototype.account_name = "";
    CMsgClientLogon.prototype.password = "";
    CMsgClientLogon.prototype.game_server_token = "";
    CMsgClientLogon.prototype.login_key = "";
    CMsgClientLogon.prototype.was_converted_deprecated_msg = false;
    CMsgClientLogon.prototype.anon_user_target_account_name = "";
    CMsgClientLogon.prototype.resolved_user_steam_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientLogon.prototype.eresult_sentryfile = 0;
    CMsgClientLogon.prototype.sha_sentryfile = $util.newBuffer([]);
    CMsgClientLogon.prototype.auth_code = "";
    CMsgClientLogon.prototype.otp_type = 0;
    CMsgClientLogon.prototype.otp_value = 0;
    CMsgClientLogon.prototype.otp_identifier = "";
    CMsgClientLogon.prototype.steam2_ticket_request = false;
    CMsgClientLogon.prototype.sony_psn_ticket = $util.newBuffer([]);
    CMsgClientLogon.prototype.sony_psn_service_id = "";
    CMsgClientLogon.prototype.create_new_psn_linked_account_if_needed = false;
    CMsgClientLogon.prototype.sony_psn_name = "";
    CMsgClientLogon.prototype.game_server_app_id = 0;
    CMsgClientLogon.prototype.steamguard_dont_remember_computer = false;
    CMsgClientLogon.prototype.machine_name = "";
    CMsgClientLogon.prototype.machine_name_userchosen = "";
    CMsgClientLogon.prototype.country_override = "";
    CMsgClientLogon.prototype.is_steam_box = false;
    CMsgClientLogon.prototype.client_instance_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientLogon.prototype.two_factor_code = "";
    CMsgClientLogon.prototype.supports_rate_limit_response = false;
    CMsgClientLogon.prototype.web_logon_nonce = "";
    CMsgClientLogon.prototype.priority_reason = 0;
    CMsgClientLogon.prototype.embedded_client_secret = null;
    CMsgClientLogon.prototype.disable_partner_autogrants = false;
    CMsgClientLogon.prototype.is_steam_deck = false;
    CMsgClientLogon.prototype.access_token = "";
    CMsgClientLogon.prototype.is_chrome_os = false;
    CMsgClientLogon.prototype.is_tesla = false;

    CMsgClientLogon.create = function create(properties) {
        return new CMsgClientLogon(properties);
    };

    CMsgClientLogon.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.protocol_version != null && Object.hasOwnProperty.call(message, "protocol_version"))
            writer.uint32(8).uint32(message.protocol_version);
        if (message.deprecated_obfustucated_private_ip != null && Object.hasOwnProperty.call(message, "deprecated_obfustucated_private_ip"))
            writer.uint32(16).uint32(message.deprecated_obfustucated_private_ip);
        if (message.cell_id != null && Object.hasOwnProperty.call(message, "cell_id"))
            writer.uint32(24).uint32(message.cell_id);
        if (message.last_session_id != null && Object.hasOwnProperty.call(message, "last_session_id"))
            writer.uint32(32).uint32(message.last_session_id);
        if (message.client_package_version != null && Object.hasOwnProperty.call(message, "client_package_version"))
            writer.uint32(40).uint32(message.client_package_version);
        if (message.client_language != null && Object.hasOwnProperty.call(message, "client_language"))
            writer.uint32(50).string(message.client_language);
        if (message.client_os_type != null && Object.hasOwnProperty.call(message, "client_os_type"))
            writer.uint32(56).uint32(message.client_os_type);
        if (message.should_remember_password != null && Object.hasOwnProperty.call(message, "should_remember_password"))
            writer.uint32(64).bool(message.should_remember_password);
        if (message.wine_version != null && Object.hasOwnProperty.call(message, "wine_version"))
            writer.uint32(74).string(message.wine_version);
        if (message.deprecated_10 != null && Object.hasOwnProperty.call(message, "deprecated_10"))
            writer.uint32(80).uint32(message.deprecated_10);
        if (message.obfuscated_private_ip != null && Object.hasOwnProperty.call(message, "obfuscated_private_ip"))
            $root.CMsgIPAddress.encode(message.obfuscated_private_ip, writer.uint32(90).fork(), q + 1).ldelim();
        if (message.deprecated_public_ip != null && Object.hasOwnProperty.call(message, "deprecated_public_ip"))
            writer.uint32(160).uint32(message.deprecated_public_ip);
        if (message.qos_level != null && Object.hasOwnProperty.call(message, "qos_level"))
            writer.uint32(168).uint32(message.qos_level);
        if (message.client_supplied_steam_id != null && Object.hasOwnProperty.call(message, "client_supplied_steam_id"))
            writer.uint32(177).fixed64(message.client_supplied_steam_id);
        if (message.public_ip != null && Object.hasOwnProperty.call(message, "public_ip"))
            $root.CMsgIPAddress.encode(message.public_ip, writer.uint32(186).fork(), q + 1).ldelim();
        if (message.machine_id != null && Object.hasOwnProperty.call(message, "machine_id"))
            writer.uint32(242).bytes(message.machine_id);
        if (message.launcher_type != null && Object.hasOwnProperty.call(message, "launcher_type"))
            writer.uint32(248).uint32(message.launcher_type);
        if (message.ui_mode != null && Object.hasOwnProperty.call(message, "ui_mode"))
            writer.uint32(256).uint32(message.ui_mode);
        if (message.chat_mode != null && Object.hasOwnProperty.call(message, "chat_mode"))
            writer.uint32(264).uint32(message.chat_mode);
        if (message.steam2_auth_ticket != null && Object.hasOwnProperty.call(message, "steam2_auth_ticket"))
            writer.uint32(330).bytes(message.steam2_auth_ticket);
        if (message.email_address != null && Object.hasOwnProperty.call(message, "email_address"))
            writer.uint32(338).string(message.email_address);
        if (message.rtime32_account_creation != null && Object.hasOwnProperty.call(message, "rtime32_account_creation"))
            writer.uint32(349).fixed32(message.rtime32_account_creation);
        if (message.account_name != null && Object.hasOwnProperty.call(message, "account_name"))
            writer.uint32(402).string(message.account_name);
        if (message.password != null && Object.hasOwnProperty.call(message, "password"))
            writer.uint32(410).string(message.password);
        if (message.game_server_token != null && Object.hasOwnProperty.call(message, "game_server_token"))
            writer.uint32(418).string(message.game_server_token);
        if (message.login_key != null && Object.hasOwnProperty.call(message, "login_key"))
            writer.uint32(482).string(message.login_key);
        if (message.was_converted_deprecated_msg != null && Object.hasOwnProperty.call(message, "was_converted_deprecated_msg"))
            writer.uint32(560).bool(message.was_converted_deprecated_msg);
        if (message.anon_user_target_account_name != null && Object.hasOwnProperty.call(message, "anon_user_target_account_name"))
            writer.uint32(642).string(message.anon_user_target_account_name);
        if (message.resolved_user_steam_id != null && Object.hasOwnProperty.call(message, "resolved_user_steam_id"))
            writer.uint32(649).fixed64(message.resolved_user_steam_id);
        if (message.eresult_sentryfile != null && Object.hasOwnProperty.call(message, "eresult_sentryfile"))
            writer.uint32(656).int32(message.eresult_sentryfile);
        if (message.sha_sentryfile != null && Object.hasOwnProperty.call(message, "sha_sentryfile"))
            writer.uint32(666).bytes(message.sha_sentryfile);
        if (message.auth_code != null && Object.hasOwnProperty.call(message, "auth_code"))
            writer.uint32(674).string(message.auth_code);
        if (message.otp_type != null && Object.hasOwnProperty.call(message, "otp_type"))
            writer.uint32(680).int32(message.otp_type);
        if (message.otp_value != null && Object.hasOwnProperty.call(message, "otp_value"))
            writer.uint32(688).uint32(message.otp_value);
        if (message.otp_identifier != null && Object.hasOwnProperty.call(message, "otp_identifier"))
            writer.uint32(698).string(message.otp_identifier);
        if (message.steam2_ticket_request != null && Object.hasOwnProperty.call(message, "steam2_ticket_request"))
            writer.uint32(704).bool(message.steam2_ticket_request);
        if (message.sony_psn_ticket != null && Object.hasOwnProperty.call(message, "sony_psn_ticket"))
            writer.uint32(722).bytes(message.sony_psn_ticket);
        if (message.sony_psn_service_id != null && Object.hasOwnProperty.call(message, "sony_psn_service_id"))
            writer.uint32(730).string(message.sony_psn_service_id);
        if (message.create_new_psn_linked_account_if_needed != null && Object.hasOwnProperty.call(message, "create_new_psn_linked_account_if_needed"))
            writer.uint32(736).bool(message.create_new_psn_linked_account_if_needed);
        if (message.sony_psn_name != null && Object.hasOwnProperty.call(message, "sony_psn_name"))
            writer.uint32(746).string(message.sony_psn_name);
        if (message.game_server_app_id != null && Object.hasOwnProperty.call(message, "game_server_app_id"))
            writer.uint32(752).int32(message.game_server_app_id);
        if (message.steamguard_dont_remember_computer != null && Object.hasOwnProperty.call(message, "steamguard_dont_remember_computer"))
            writer.uint32(760).bool(message.steamguard_dont_remember_computer);
        if (message.machine_name != null && Object.hasOwnProperty.call(message, "machine_name"))
            writer.uint32(770).string(message.machine_name);
        if (message.machine_name_userchosen != null && Object.hasOwnProperty.call(message, "machine_name_userchosen"))
            writer.uint32(778).string(message.machine_name_userchosen);
        if (message.country_override != null && Object.hasOwnProperty.call(message, "country_override"))
            writer.uint32(786).string(message.country_override);
        if (message.is_steam_box != null && Object.hasOwnProperty.call(message, "is_steam_box"))
            writer.uint32(792).bool(message.is_steam_box);
        if (message.client_instance_id != null && Object.hasOwnProperty.call(message, "client_instance_id"))
            writer.uint32(800).uint64(message.client_instance_id);
        if (message.two_factor_code != null && Object.hasOwnProperty.call(message, "two_factor_code"))
            writer.uint32(810).string(message.two_factor_code);
        if (message.supports_rate_limit_response != null && Object.hasOwnProperty.call(message, "supports_rate_limit_response"))
            writer.uint32(816).bool(message.supports_rate_limit_response);
        if (message.web_logon_nonce != null && Object.hasOwnProperty.call(message, "web_logon_nonce"))
            writer.uint32(826).string(message.web_logon_nonce);
        if (message.priority_reason != null && Object.hasOwnProperty.call(message, "priority_reason"))
            writer.uint32(832).int32(message.priority_reason);
        if (message.embedded_client_secret != null && Object.hasOwnProperty.call(message, "embedded_client_secret"))
            $root.CMsgClientSecret.encode(message.embedded_client_secret, writer.uint32(842).fork(), q + 1).ldelim();
        if (message.disable_partner_autogrants != null && Object.hasOwnProperty.call(message, "disable_partner_autogrants"))
            writer.uint32(848).bool(message.disable_partner_autogrants);
        if (message.is_steam_deck != null && Object.hasOwnProperty.call(message, "is_steam_deck"))
            writer.uint32(856).bool(message.is_steam_deck);
        if (message.access_token != null && Object.hasOwnProperty.call(message, "access_token"))
            writer.uint32(866).string(message.access_token);
        if (message.is_chrome_os != null && Object.hasOwnProperty.call(message, "is_chrome_os"))
            writer.uint32(872).bool(message.is_chrome_os);
        if (message.is_tesla != null && Object.hasOwnProperty.call(message, "is_tesla"))
            writer.uint32(880).bool(message.is_tesla);
        return writer;
    };

    CMsgClientLogon.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientLogon();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.protocol_version = reader.uint32();
                    break;
                }
            case 2: {
                    message.deprecated_obfustucated_private_ip = reader.uint32();
                    break;
                }
            case 3: {
                    message.cell_id = reader.uint32();
                    break;
                }
            case 4: {
                    message.last_session_id = reader.uint32();
                    break;
                }
            case 5: {
                    message.client_package_version = reader.uint32();
                    break;
                }
            case 6: {
                    message.client_language = reader.string();
                    break;
                }
            case 7: {
                    message.client_os_type = reader.uint32();
                    break;
                }
            case 8: {
                    message.should_remember_password = reader.bool();
                    break;
                }
            case 9: {
                    message.wine_version = reader.string();
                    break;
                }
            case 10: {
                    message.deprecated_10 = reader.uint32();
                    break;
                }
            case 11: {
                    message.obfuscated_private_ip = $root.CMsgIPAddress.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            case 20: {
                    message.deprecated_public_ip = reader.uint32();
                    break;
                }
            case 21: {
                    message.qos_level = reader.uint32();
                    break;
                }
            case 22: {
                    message.client_supplied_steam_id = reader.fixed64();
                    break;
                }
            case 23: {
                    message.public_ip = $root.CMsgIPAddress.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            case 30: {
                    message.machine_id = reader.bytes();
                    break;
                }
            case 31: {
                    message.launcher_type = reader.uint32();
                    break;
                }
            case 32: {
                    message.ui_mode = reader.uint32();
                    break;
                }
            case 33: {
                    message.chat_mode = reader.uint32();
                    break;
                }
            case 41: {
                    message.steam2_auth_ticket = reader.bytes();
                    break;
                }
            case 42: {
                    message.email_address = reader.string();
                    break;
                }
            case 43: {
                    message.rtime32_account_creation = reader.fixed32();
                    break;
                }
            case 50: {
                    message.account_name = reader.string();
                    break;
                }
            case 51: {
                    message.password = reader.string();
                    break;
                }
            case 52: {
                    message.game_server_token = reader.string();
                    break;
                }
            case 60: {
                    message.login_key = reader.string();
                    break;
                }
            case 70: {
                    message.was_converted_deprecated_msg = reader.bool();
                    break;
                }
            case 80: {
                    message.anon_user_target_account_name = reader.string();
                    break;
                }
            case 81: {
                    message.resolved_user_steam_id = reader.fixed64();
                    break;
                }
            case 82: {
                    message.eresult_sentryfile = reader.int32();
                    break;
                }
            case 83: {
                    message.sha_sentryfile = reader.bytes();
                    break;
                }
            case 84: {
                    message.auth_code = reader.string();
                    break;
                }
            case 85: {
                    message.otp_type = reader.int32();
                    break;
                }
            case 86: {
                    message.otp_value = reader.uint32();
                    break;
                }
            case 87: {
                    message.otp_identifier = reader.string();
                    break;
                }
            case 88: {
                    message.steam2_ticket_request = reader.bool();
                    break;
                }
            case 90: {
                    message.sony_psn_ticket = reader.bytes();
                    break;
                }
            case 91: {
                    message.sony_psn_service_id = reader.string();
                    break;
                }
            case 92: {
                    message.create_new_psn_linked_account_if_needed = reader.bool();
                    break;
                }
            case 93: {
                    message.sony_psn_name = reader.string();
                    break;
                }
            case 94: {
                    message.game_server_app_id = reader.int32();
                    break;
                }
            case 95: {
                    message.steamguard_dont_remember_computer = reader.bool();
                    break;
                }
            case 96: {
                    message.machine_name = reader.string();
                    break;
                }
            case 97: {
                    message.machine_name_userchosen = reader.string();
                    break;
                }
            case 98: {
                    message.country_override = reader.string();
                    break;
                }
            case 99: {
                    message.is_steam_box = reader.bool();
                    break;
                }
            case 100: {
                    message.client_instance_id = reader.uint64();
                    break;
                }
            case 101: {
                    message.two_factor_code = reader.string();
                    break;
                }
            case 102: {
                    message.supports_rate_limit_response = reader.bool();
                    break;
                }
            case 103: {
                    message.web_logon_nonce = reader.string();
                    break;
                }
            case 104: {
                    message.priority_reason = reader.int32();
                    break;
                }
            case 105: {
                    message.embedded_client_secret = $root.CMsgClientSecret.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            case 106: {
                    message.disable_partner_autogrants = reader.bool();
                    break;
                }
            case 107: {
                    message.is_steam_deck = reader.bool();
                    break;
                }
            case 108: {
                    message.access_token = reader.string();
                    break;
                }
            case 109: {
                    message.is_chrome_os = reader.bool();
                    break;
                }
            case 110: {
                    message.is_tesla = reader.bool();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientLogon.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientLogon)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientLogon: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientLogon();
        if (object.protocol_version != null)
            message.protocol_version = object.protocol_version >>> 0;
        if (object.deprecated_obfustucated_private_ip != null)
            message.deprecated_obfustucated_private_ip = object.deprecated_obfustucated_private_ip >>> 0;
        if (object.cell_id != null)
            message.cell_id = object.cell_id >>> 0;
        if (object.last_session_id != null)
            message.last_session_id = object.last_session_id >>> 0;
        if (object.client_package_version != null)
            message.client_package_version = object.client_package_version >>> 0;
        if (object.client_language != null)
            message.client_language = String(object.client_language);
        if (object.client_os_type != null)
            message.client_os_type = object.client_os_type >>> 0;
        if (object.should_remember_password != null)
            message.should_remember_password = Boolean(object.should_remember_password);
        if (object.wine_version != null)
            message.wine_version = String(object.wine_version);
        if (object.deprecated_10 != null)
            message.deprecated_10 = object.deprecated_10 >>> 0;
        if (object.obfuscated_private_ip != null) {
            if (!$util.isObject(object.obfuscated_private_ip))
                throw TypeError(".CMsgClientLogon.obfuscated_private_ip: object expected");
            message.obfuscated_private_ip = $root.CMsgIPAddress.fromObject(object.obfuscated_private_ip, long + 1);
        }
        if (object.deprecated_public_ip != null)
            message.deprecated_public_ip = object.deprecated_public_ip >>> 0;
        if (object.qos_level != null)
            message.qos_level = object.qos_level >>> 0;
        if (object.client_supplied_steam_id != null)
            if ($util.Long)
                message.client_supplied_steam_id = $util.Long.fromValue(object.client_supplied_steam_id, true);
            else if (typeof object.client_supplied_steam_id === "string")
                message.client_supplied_steam_id = parseInt(object.client_supplied_steam_id, 10);
            else if (typeof object.client_supplied_steam_id === "number")
                message.client_supplied_steam_id = object.client_supplied_steam_id;
            else if (typeof object.client_supplied_steam_id === "object")
                message.client_supplied_steam_id = new $util.LongBits(object.client_supplied_steam_id.low >>> 0, object.client_supplied_steam_id.high >>> 0).toNumber(true);
        if (object.public_ip != null) {
            if (!$util.isObject(object.public_ip))
                throw TypeError(".CMsgClientLogon.public_ip: object expected");
            message.public_ip = $root.CMsgIPAddress.fromObject(object.public_ip, long + 1);
        }
        if (object.machine_id != null)
            if (typeof object.machine_id === "string")
                $util.base64.decode(object.machine_id, message.machine_id = $util.newBuffer($util.base64.length(object.machine_id)), 0);
            else if (object.machine_id.length >= 0)
                message.machine_id = object.machine_id;
        if (object.launcher_type != null)
            message.launcher_type = object.launcher_type >>> 0;
        if (object.ui_mode != null)
            message.ui_mode = object.ui_mode >>> 0;
        if (object.chat_mode != null)
            message.chat_mode = object.chat_mode >>> 0;
        if (object.steam2_auth_ticket != null)
            if (typeof object.steam2_auth_ticket === "string")
                $util.base64.decode(object.steam2_auth_ticket, message.steam2_auth_ticket = $util.newBuffer($util.base64.length(object.steam2_auth_ticket)), 0);
            else if (object.steam2_auth_ticket.length >= 0)
                message.steam2_auth_ticket = object.steam2_auth_ticket;
        if (object.email_address != null)
            message.email_address = String(object.email_address);
        if (object.rtime32_account_creation != null)
            message.rtime32_account_creation = object.rtime32_account_creation >>> 0;
        if (object.account_name != null)
            message.account_name = String(object.account_name);
        if (object.password != null)
            message.password = String(object.password);
        if (object.game_server_token != null)
            message.game_server_token = String(object.game_server_token);
        if (object.login_key != null)
            message.login_key = String(object.login_key);
        if (object.was_converted_deprecated_msg != null)
            message.was_converted_deprecated_msg = Boolean(object.was_converted_deprecated_msg);
        if (object.anon_user_target_account_name != null)
            message.anon_user_target_account_name = String(object.anon_user_target_account_name);
        if (object.resolved_user_steam_id != null)
            if ($util.Long)
                message.resolved_user_steam_id = $util.Long.fromValue(object.resolved_user_steam_id, true);
            else if (typeof object.resolved_user_steam_id === "string")
                message.resolved_user_steam_id = parseInt(object.resolved_user_steam_id, 10);
            else if (typeof object.resolved_user_steam_id === "number")
                message.resolved_user_steam_id = object.resolved_user_steam_id;
            else if (typeof object.resolved_user_steam_id === "object")
                message.resolved_user_steam_id = new $util.LongBits(object.resolved_user_steam_id.low >>> 0, object.resolved_user_steam_id.high >>> 0).toNumber(true);
        if (object.eresult_sentryfile != null)
            message.eresult_sentryfile = object.eresult_sentryfile | 0;
        if (object.sha_sentryfile != null)
            if (typeof object.sha_sentryfile === "string")
                $util.base64.decode(object.sha_sentryfile, message.sha_sentryfile = $util.newBuffer($util.base64.length(object.sha_sentryfile)), 0);
            else if (object.sha_sentryfile.length >= 0)
                message.sha_sentryfile = object.sha_sentryfile;
        if (object.auth_code != null)
            message.auth_code = String(object.auth_code);
        if (object.otp_type != null)
            message.otp_type = object.otp_type | 0;
        if (object.otp_value != null)
            message.otp_value = object.otp_value >>> 0;
        if (object.otp_identifier != null)
            message.otp_identifier = String(object.otp_identifier);
        if (object.steam2_ticket_request != null)
            message.steam2_ticket_request = Boolean(object.steam2_ticket_request);
        if (object.sony_psn_ticket != null)
            if (typeof object.sony_psn_ticket === "string")
                $util.base64.decode(object.sony_psn_ticket, message.sony_psn_ticket = $util.newBuffer($util.base64.length(object.sony_psn_ticket)), 0);
            else if (object.sony_psn_ticket.length >= 0)
                message.sony_psn_ticket = object.sony_psn_ticket;
        if (object.sony_psn_service_id != null)
            message.sony_psn_service_id = String(object.sony_psn_service_id);
        if (object.create_new_psn_linked_account_if_needed != null)
            message.create_new_psn_linked_account_if_needed = Boolean(object.create_new_psn_linked_account_if_needed);
        if (object.sony_psn_name != null)
            message.sony_psn_name = String(object.sony_psn_name);
        if (object.game_server_app_id != null)
            message.game_server_app_id = object.game_server_app_id | 0;
        if (object.steamguard_dont_remember_computer != null)
            message.steamguard_dont_remember_computer = Boolean(object.steamguard_dont_remember_computer);
        if (object.machine_name != null)
            message.machine_name = String(object.machine_name);
        if (object.machine_name_userchosen != null)
            message.machine_name_userchosen = String(object.machine_name_userchosen);
        if (object.country_override != null)
            message.country_override = String(object.country_override);
        if (object.is_steam_box != null)
            message.is_steam_box = Boolean(object.is_steam_box);
        if (object.client_instance_id != null)
            if ($util.Long)
                message.client_instance_id = $util.Long.fromValue(object.client_instance_id, true);
            else if (typeof object.client_instance_id === "string")
                message.client_instance_id = parseInt(object.client_instance_id, 10);
            else if (typeof object.client_instance_id === "number")
                message.client_instance_id = object.client_instance_id;
            else if (typeof object.client_instance_id === "object")
                message.client_instance_id = new $util.LongBits(object.client_instance_id.low >>> 0, object.client_instance_id.high >>> 0).toNumber(true);
        if (object.two_factor_code != null)
            message.two_factor_code = String(object.two_factor_code);
        if (object.supports_rate_limit_response != null)
            message.supports_rate_limit_response = Boolean(object.supports_rate_limit_response);
        if (object.web_logon_nonce != null)
            message.web_logon_nonce = String(object.web_logon_nonce);
        if (object.priority_reason != null)
            message.priority_reason = object.priority_reason | 0;
        if (object.embedded_client_secret != null) {
            if (!$util.isObject(object.embedded_client_secret))
                throw TypeError(".CMsgClientLogon.embedded_client_secret: object expected");
            message.embedded_client_secret = $root.CMsgClientSecret.fromObject(object.embedded_client_secret, long + 1);
        }
        if (object.disable_partner_autogrants != null)
            message.disable_partner_autogrants = Boolean(object.disable_partner_autogrants);
        if (object.is_steam_deck != null)
            message.is_steam_deck = Boolean(object.is_steam_deck);
        if (object.access_token != null)
            message.access_token = String(object.access_token);
        if (object.is_chrome_os != null)
            message.is_chrome_os = Boolean(object.is_chrome_os);
        if (object.is_tesla != null)
            message.is_tesla = Boolean(object.is_tesla);
        return message;
    };

    CMsgClientLogon.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.protocol_version = 0;
            object.deprecated_obfustucated_private_ip = 0;
            object.cell_id = 0;
            object.last_session_id = 0;
            object.client_package_version = 0;
            object.client_language = "";
            object.client_os_type = 0;
            object.should_remember_password = false;
            object.wine_version = "";
            object.deprecated_10 = 0;
            object.obfuscated_private_ip = null;
            object.deprecated_public_ip = 0;
            object.qos_level = 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.client_supplied_steam_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.client_supplied_steam_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.public_ip = null;
            if (options.bytes === String)
                object.machine_id = "";
            else {
                object.machine_id = [];
                if (options.bytes !== Array)
                    object.machine_id = $util.newBuffer(object.machine_id);
            }
            object.launcher_type = 0;
            object.ui_mode = 0;
            object.chat_mode = 0;
            if (options.bytes === String)
                object.steam2_auth_ticket = "";
            else {
                object.steam2_auth_ticket = [];
                if (options.bytes !== Array)
                    object.steam2_auth_ticket = $util.newBuffer(object.steam2_auth_ticket);
            }
            object.email_address = "";
            object.rtime32_account_creation = 0;
            object.account_name = "";
            object.password = "";
            object.game_server_token = "";
            object.login_key = "";
            object.was_converted_deprecated_msg = false;
            object.anon_user_target_account_name = "";
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.resolved_user_steam_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.resolved_user_steam_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.eresult_sentryfile = 0;
            if (options.bytes === String)
                object.sha_sentryfile = "";
            else {
                object.sha_sentryfile = [];
                if (options.bytes !== Array)
                    object.sha_sentryfile = $util.newBuffer(object.sha_sentryfile);
            }
            object.auth_code = "";
            object.otp_type = 0;
            object.otp_value = 0;
            object.otp_identifier = "";
            object.steam2_ticket_request = false;
            if (options.bytes === String)
                object.sony_psn_ticket = "";
            else {
                object.sony_psn_ticket = [];
                if (options.bytes !== Array)
                    object.sony_psn_ticket = $util.newBuffer(object.sony_psn_ticket);
            }
            object.sony_psn_service_id = "";
            object.create_new_psn_linked_account_if_needed = false;
            object.sony_psn_name = "";
            object.game_server_app_id = 0;
            object.steamguard_dont_remember_computer = false;
            object.machine_name = "";
            object.machine_name_userchosen = "";
            object.country_override = "";
            object.is_steam_box = false;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.client_instance_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.client_instance_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.two_factor_code = "";
            object.supports_rate_limit_response = false;
            object.web_logon_nonce = "";
            object.priority_reason = 0;
            object.embedded_client_secret = null;
            object.disable_partner_autogrants = false;
            object.is_steam_deck = false;
            object.access_token = "";
            object.is_chrome_os = false;
            object.is_tesla = false;
        }
        if (message.protocol_version != null && Object.hasOwnProperty.call(message, "protocol_version"))
            object.protocol_version = message.protocol_version;
        if (message.deprecated_obfustucated_private_ip != null && Object.hasOwnProperty.call(message, "deprecated_obfustucated_private_ip"))
            object.deprecated_obfustucated_private_ip = message.deprecated_obfustucated_private_ip;
        if (message.cell_id != null && Object.hasOwnProperty.call(message, "cell_id"))
            object.cell_id = message.cell_id;
        if (message.last_session_id != null && Object.hasOwnProperty.call(message, "last_session_id"))
            object.last_session_id = message.last_session_id;
        if (message.client_package_version != null && Object.hasOwnProperty.call(message, "client_package_version"))
            object.client_package_version = message.client_package_version;
        if (message.client_language != null && Object.hasOwnProperty.call(message, "client_language"))
            object.client_language = message.client_language;
        if (message.client_os_type != null && Object.hasOwnProperty.call(message, "client_os_type"))
            object.client_os_type = message.client_os_type;
        if (message.should_remember_password != null && Object.hasOwnProperty.call(message, "should_remember_password"))
            object.should_remember_password = message.should_remember_password;
        if (message.wine_version != null && Object.hasOwnProperty.call(message, "wine_version"))
            object.wine_version = message.wine_version;
        if (message.deprecated_10 != null && Object.hasOwnProperty.call(message, "deprecated_10"))
            object.deprecated_10 = message.deprecated_10;
        if (message.obfuscated_private_ip != null && Object.hasOwnProperty.call(message, "obfuscated_private_ip"))
            object.obfuscated_private_ip = $root.CMsgIPAddress.toObject(message.obfuscated_private_ip, options, q + 1);
        if (message.deprecated_public_ip != null && Object.hasOwnProperty.call(message, "deprecated_public_ip"))
            object.deprecated_public_ip = message.deprecated_public_ip;
        if (message.qos_level != null && Object.hasOwnProperty.call(message, "qos_level"))
            object.qos_level = message.qos_level;
        if (message.client_supplied_steam_id != null && Object.hasOwnProperty.call(message, "client_supplied_steam_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.client_supplied_steam_id = typeof message.client_supplied_steam_id === "number" ? BigInt(message.client_supplied_steam_id) : $util.Long.fromBits(message.client_supplied_steam_id.low >>> 0, message.client_supplied_steam_id.high >>> 0, true).toBigInt();
            else if (typeof message.client_supplied_steam_id === "number")
                object.client_supplied_steam_id = options.longs === String ? String(message.client_supplied_steam_id) : message.client_supplied_steam_id;
            else
                object.client_supplied_steam_id = options.longs === String ? $util.Long.prototype.toString.call(message.client_supplied_steam_id) : options.longs === Number ? new $util.LongBits(message.client_supplied_steam_id.low >>> 0, message.client_supplied_steam_id.high >>> 0).toNumber(true) : message.client_supplied_steam_id;
        if (message.public_ip != null && Object.hasOwnProperty.call(message, "public_ip"))
            object.public_ip = $root.CMsgIPAddress.toObject(message.public_ip, options, q + 1);
        if (message.machine_id != null && Object.hasOwnProperty.call(message, "machine_id"))
            object.machine_id = options.bytes === String ? $util.base64.encode(message.machine_id, 0, message.machine_id.length) : options.bytes === Array ? Array.prototype.slice.call(message.machine_id) : message.machine_id;
        if (message.launcher_type != null && Object.hasOwnProperty.call(message, "launcher_type"))
            object.launcher_type = message.launcher_type;
        if (message.ui_mode != null && Object.hasOwnProperty.call(message, "ui_mode"))
            object.ui_mode = message.ui_mode;
        if (message.chat_mode != null && Object.hasOwnProperty.call(message, "chat_mode"))
            object.chat_mode = message.chat_mode;
        if (message.steam2_auth_ticket != null && Object.hasOwnProperty.call(message, "steam2_auth_ticket"))
            object.steam2_auth_ticket = options.bytes === String ? $util.base64.encode(message.steam2_auth_ticket, 0, message.steam2_auth_ticket.length) : options.bytes === Array ? Array.prototype.slice.call(message.steam2_auth_ticket) : message.steam2_auth_ticket;
        if (message.email_address != null && Object.hasOwnProperty.call(message, "email_address"))
            object.email_address = message.email_address;
        if (message.rtime32_account_creation != null && Object.hasOwnProperty.call(message, "rtime32_account_creation"))
            object.rtime32_account_creation = message.rtime32_account_creation;
        if (message.account_name != null && Object.hasOwnProperty.call(message, "account_name"))
            object.account_name = message.account_name;
        if (message.password != null && Object.hasOwnProperty.call(message, "password"))
            object.password = message.password;
        if (message.game_server_token != null && Object.hasOwnProperty.call(message, "game_server_token"))
            object.game_server_token = message.game_server_token;
        if (message.login_key != null && Object.hasOwnProperty.call(message, "login_key"))
            object.login_key = message.login_key;
        if (message.was_converted_deprecated_msg != null && Object.hasOwnProperty.call(message, "was_converted_deprecated_msg"))
            object.was_converted_deprecated_msg = message.was_converted_deprecated_msg;
        if (message.anon_user_target_account_name != null && Object.hasOwnProperty.call(message, "anon_user_target_account_name"))
            object.anon_user_target_account_name = message.anon_user_target_account_name;
        if (message.resolved_user_steam_id != null && Object.hasOwnProperty.call(message, "resolved_user_steam_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.resolved_user_steam_id = typeof message.resolved_user_steam_id === "number" ? BigInt(message.resolved_user_steam_id) : $util.Long.fromBits(message.resolved_user_steam_id.low >>> 0, message.resolved_user_steam_id.high >>> 0, true).toBigInt();
            else if (typeof message.resolved_user_steam_id === "number")
                object.resolved_user_steam_id = options.longs === String ? String(message.resolved_user_steam_id) : message.resolved_user_steam_id;
            else
                object.resolved_user_steam_id = options.longs === String ? $util.Long.prototype.toString.call(message.resolved_user_steam_id) : options.longs === Number ? new $util.LongBits(message.resolved_user_steam_id.low >>> 0, message.resolved_user_steam_id.high >>> 0).toNumber(true) : message.resolved_user_steam_id;
        if (message.eresult_sentryfile != null && Object.hasOwnProperty.call(message, "eresult_sentryfile"))
            object.eresult_sentryfile = message.eresult_sentryfile;
        if (message.sha_sentryfile != null && Object.hasOwnProperty.call(message, "sha_sentryfile"))
            object.sha_sentryfile = options.bytes === String ? $util.base64.encode(message.sha_sentryfile, 0, message.sha_sentryfile.length) : options.bytes === Array ? Array.prototype.slice.call(message.sha_sentryfile) : message.sha_sentryfile;
        if (message.auth_code != null && Object.hasOwnProperty.call(message, "auth_code"))
            object.auth_code = message.auth_code;
        if (message.otp_type != null && Object.hasOwnProperty.call(message, "otp_type"))
            object.otp_type = message.otp_type;
        if (message.otp_value != null && Object.hasOwnProperty.call(message, "otp_value"))
            object.otp_value = message.otp_value;
        if (message.otp_identifier != null && Object.hasOwnProperty.call(message, "otp_identifier"))
            object.otp_identifier = message.otp_identifier;
        if (message.steam2_ticket_request != null && Object.hasOwnProperty.call(message, "steam2_ticket_request"))
            object.steam2_ticket_request = message.steam2_ticket_request;
        if (message.sony_psn_ticket != null && Object.hasOwnProperty.call(message, "sony_psn_ticket"))
            object.sony_psn_ticket = options.bytes === String ? $util.base64.encode(message.sony_psn_ticket, 0, message.sony_psn_ticket.length) : options.bytes === Array ? Array.prototype.slice.call(message.sony_psn_ticket) : message.sony_psn_ticket;
        if (message.sony_psn_service_id != null && Object.hasOwnProperty.call(message, "sony_psn_service_id"))
            object.sony_psn_service_id = message.sony_psn_service_id;
        if (message.create_new_psn_linked_account_if_needed != null && Object.hasOwnProperty.call(message, "create_new_psn_linked_account_if_needed"))
            object.create_new_psn_linked_account_if_needed = message.create_new_psn_linked_account_if_needed;
        if (message.sony_psn_name != null && Object.hasOwnProperty.call(message, "sony_psn_name"))
            object.sony_psn_name = message.sony_psn_name;
        if (message.game_server_app_id != null && Object.hasOwnProperty.call(message, "game_server_app_id"))
            object.game_server_app_id = message.game_server_app_id;
        if (message.steamguard_dont_remember_computer != null && Object.hasOwnProperty.call(message, "steamguard_dont_remember_computer"))
            object.steamguard_dont_remember_computer = message.steamguard_dont_remember_computer;
        if (message.machine_name != null && Object.hasOwnProperty.call(message, "machine_name"))
            object.machine_name = message.machine_name;
        if (message.machine_name_userchosen != null && Object.hasOwnProperty.call(message, "machine_name_userchosen"))
            object.machine_name_userchosen = message.machine_name_userchosen;
        if (message.country_override != null && Object.hasOwnProperty.call(message, "country_override"))
            object.country_override = message.country_override;
        if (message.is_steam_box != null && Object.hasOwnProperty.call(message, "is_steam_box"))
            object.is_steam_box = message.is_steam_box;
        if (message.client_instance_id != null && Object.hasOwnProperty.call(message, "client_instance_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.client_instance_id = typeof message.client_instance_id === "number" ? BigInt(message.client_instance_id) : $util.Long.fromBits(message.client_instance_id.low >>> 0, message.client_instance_id.high >>> 0, true).toBigInt();
            else if (typeof message.client_instance_id === "number")
                object.client_instance_id = options.longs === String ? String(message.client_instance_id) : message.client_instance_id;
            else
                object.client_instance_id = options.longs === String ? $util.Long.prototype.toString.call(message.client_instance_id) : options.longs === Number ? new $util.LongBits(message.client_instance_id.low >>> 0, message.client_instance_id.high >>> 0).toNumber(true) : message.client_instance_id;
        if (message.two_factor_code != null && Object.hasOwnProperty.call(message, "two_factor_code"))
            object.two_factor_code = message.two_factor_code;
        if (message.supports_rate_limit_response != null && Object.hasOwnProperty.call(message, "supports_rate_limit_response"))
            object.supports_rate_limit_response = message.supports_rate_limit_response;
        if (message.web_logon_nonce != null && Object.hasOwnProperty.call(message, "web_logon_nonce"))
            object.web_logon_nonce = message.web_logon_nonce;
        if (message.priority_reason != null && Object.hasOwnProperty.call(message, "priority_reason"))
            object.priority_reason = message.priority_reason;
        if (message.embedded_client_secret != null && Object.hasOwnProperty.call(message, "embedded_client_secret"))
            object.embedded_client_secret = $root.CMsgClientSecret.toObject(message.embedded_client_secret, options, q + 1);
        if (message.disable_partner_autogrants != null && Object.hasOwnProperty.call(message, "disable_partner_autogrants"))
            object.disable_partner_autogrants = message.disable_partner_autogrants;
        if (message.is_steam_deck != null && Object.hasOwnProperty.call(message, "is_steam_deck"))
            object.is_steam_deck = message.is_steam_deck;
        if (message.access_token != null && Object.hasOwnProperty.call(message, "access_token"))
            object.access_token = message.access_token;
        if (message.is_chrome_os != null && Object.hasOwnProperty.call(message, "is_chrome_os"))
            object.is_chrome_os = message.is_chrome_os;
        if (message.is_tesla != null && Object.hasOwnProperty.call(message, "is_tesla"))
            object.is_tesla = message.is_tesla;
        return object;
    };

    CMsgClientLogon.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientLogon.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientLogon";
    };

    return CMsgClientLogon;
})();

export const CMsgIPAddress = $root.CMsgIPAddress = (() => {

    function CMsgIPAddress(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgIPAddress.prototype.v4 = 0;
    CMsgIPAddress.prototype.v6 = $util.newBuffer([]);

    CMsgIPAddress.create = function create(properties) {
        return new CMsgIPAddress(properties);
    };

    CMsgIPAddress.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.v4 != null && Object.hasOwnProperty.call(message, "v4"))
            writer.uint32(13).fixed32(message.v4);
        if (message.v6 != null && Object.hasOwnProperty.call(message, "v6"))
            writer.uint32(18).bytes(message.v6);
        return writer;
    };

    CMsgIPAddress.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgIPAddress();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.v4 = reader.fixed32();
                    break;
                }
            case 2: {
                    message.v6 = reader.bytes();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgIPAddress.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgIPAddress)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgIPAddress: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgIPAddress();
        if (object.v4 != null)
            message.v4 = object.v4 >>> 0;
        if (object.v6 != null)
            if (typeof object.v6 === "string")
                $util.base64.decode(object.v6, message.v6 = $util.newBuffer($util.base64.length(object.v6)), 0);
            else if (object.v6.length >= 0)
                message.v6 = object.v6;
        return message;
    };

    CMsgIPAddress.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.v4 = 0;
            if (options.bytes === String)
                object.v6 = "";
            else {
                object.v6 = [];
                if (options.bytes !== Array)
                    object.v6 = $util.newBuffer(object.v6);
            }
        }
        if (message.v4 != null && Object.hasOwnProperty.call(message, "v4"))
            object.v4 = message.v4;
        if (message.v6 != null && Object.hasOwnProperty.call(message, "v6"))
            object.v6 = options.bytes === String ? $util.base64.encode(message.v6, 0, message.v6.length) : options.bytes === Array ? Array.prototype.slice.call(message.v6) : message.v6;
        return object;
    };

    CMsgIPAddress.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgIPAddress.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgIPAddress";
    };

    return CMsgIPAddress;
})();

export const CMsgClientSecret = $root.CMsgClientSecret = (() => {

    function CMsgClientSecret(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientSecret.prototype.version = 0;
    CMsgClientSecret.prototype.appid = 0;
    CMsgClientSecret.prototype.deviceid = 0;
    CMsgClientSecret.prototype.nonce = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientSecret.prototype.hmac = $util.newBuffer([]);

    CMsgClientSecret.create = function create(properties) {
        return new CMsgClientSecret(properties);
    };

    CMsgClientSecret.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            writer.uint32(8).uint32(message.version);
        if (message.appid != null && Object.hasOwnProperty.call(message, "appid"))
            writer.uint32(16).uint32(message.appid);
        if (message.deviceid != null && Object.hasOwnProperty.call(message, "deviceid"))
            writer.uint32(24).uint32(message.deviceid);
        if (message.nonce != null && Object.hasOwnProperty.call(message, "nonce"))
            writer.uint32(33).fixed64(message.nonce);
        if (message.hmac != null && Object.hasOwnProperty.call(message, "hmac"))
            writer.uint32(42).bytes(message.hmac);
        return writer;
    };

    CMsgClientSecret.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientSecret();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.version = reader.uint32();
                    break;
                }
            case 2: {
                    message.appid = reader.uint32();
                    break;
                }
            case 3: {
                    message.deviceid = reader.uint32();
                    break;
                }
            case 4: {
                    message.nonce = reader.fixed64();
                    break;
                }
            case 5: {
                    message.hmac = reader.bytes();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientSecret.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientSecret)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientSecret: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientSecret();
        if (object.version != null)
            message.version = object.version >>> 0;
        if (object.appid != null)
            message.appid = object.appid >>> 0;
        if (object.deviceid != null)
            message.deviceid = object.deviceid >>> 0;
        if (object.nonce != null)
            if ($util.Long)
                message.nonce = $util.Long.fromValue(object.nonce, true);
            else if (typeof object.nonce === "string")
                message.nonce = parseInt(object.nonce, 10);
            else if (typeof object.nonce === "number")
                message.nonce = object.nonce;
            else if (typeof object.nonce === "object")
                message.nonce = new $util.LongBits(object.nonce.low >>> 0, object.nonce.high >>> 0).toNumber(true);
        if (object.hmac != null)
            if (typeof object.hmac === "string")
                $util.base64.decode(object.hmac, message.hmac = $util.newBuffer($util.base64.length(object.hmac)), 0);
            else if (object.hmac.length >= 0)
                message.hmac = object.hmac;
        return message;
    };

    CMsgClientSecret.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.version = 0;
            object.appid = 0;
            object.deviceid = 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.nonce = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.nonce = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            if (options.bytes === String)
                object.hmac = "";
            else {
                object.hmac = [];
                if (options.bytes !== Array)
                    object.hmac = $util.newBuffer(object.hmac);
            }
        }
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            object.version = message.version;
        if (message.appid != null && Object.hasOwnProperty.call(message, "appid"))
            object.appid = message.appid;
        if (message.deviceid != null && Object.hasOwnProperty.call(message, "deviceid"))
            object.deviceid = message.deviceid;
        if (message.nonce != null && Object.hasOwnProperty.call(message, "nonce"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.nonce = typeof message.nonce === "number" ? BigInt(message.nonce) : $util.Long.fromBits(message.nonce.low >>> 0, message.nonce.high >>> 0, true).toBigInt();
            else if (typeof message.nonce === "number")
                object.nonce = options.longs === String ? String(message.nonce) : message.nonce;
            else
                object.nonce = options.longs === String ? $util.Long.prototype.toString.call(message.nonce) : options.longs === Number ? new $util.LongBits(message.nonce.low >>> 0, message.nonce.high >>> 0).toNumber(true) : message.nonce;
        if (message.hmac != null && Object.hasOwnProperty.call(message, "hmac"))
            object.hmac = options.bytes === String ? $util.base64.encode(message.hmac, 0, message.hmac.length) : options.bytes === Array ? Array.prototype.slice.call(message.hmac) : message.hmac;
        return object;
    };

    CMsgClientSecret.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientSecret.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientSecret";
    };

    return CMsgClientSecret;
})();

export const CMsgClientLogonResponse = $root.CMsgClientLogonResponse = (() => {

    function CMsgClientLogonResponse(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientLogonResponse.prototype.eresult = 2;
    CMsgClientLogonResponse.prototype.legacy_out_of_game_heartbeat_seconds = 0;
    CMsgClientLogonResponse.prototype.heartbeat_seconds = 0;
    CMsgClientLogonResponse.prototype.deprecated_public_ip = 0;
    CMsgClientLogonResponse.prototype.rtime32_server_time = 0;
    CMsgClientLogonResponse.prototype.account_flags = 0;
    CMsgClientLogonResponse.prototype.cell_id = 0;
    CMsgClientLogonResponse.prototype.email_domain = "";
    CMsgClientLogonResponse.prototype.steam2_ticket = $util.newBuffer([]);
    CMsgClientLogonResponse.prototype.eresult_extended = 0;
    CMsgClientLogonResponse.prototype.webapi_authenticate_user_nonce = "";
    CMsgClientLogonResponse.prototype.cell_id_ping_threshold = 0;
    CMsgClientLogonResponse.prototype.deprecated_use_pics = false;
    CMsgClientLogonResponse.prototype.vanity_url = "";
    CMsgClientLogonResponse.prototype.public_ip = null;
    CMsgClientLogonResponse.prototype.user_country = "";
    CMsgClientLogonResponse.prototype.client_supplied_steamid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientLogonResponse.prototype.ip_country_code = "";
    CMsgClientLogonResponse.prototype.parental_settings = $util.newBuffer([]);
    CMsgClientLogonResponse.prototype.parental_setting_signature = $util.newBuffer([]);
    CMsgClientLogonResponse.prototype.count_loginfailures_to_migrate = 0;
    CMsgClientLogonResponse.prototype.count_disconnects_to_migrate = 0;
    CMsgClientLogonResponse.prototype.ogs_data_report_time_window = 0;
    CMsgClientLogonResponse.prototype.client_instance_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientLogonResponse.prototype.force_client_update_check = false;
    CMsgClientLogonResponse.prototype.agreement_session_url = "";
    CMsgClientLogonResponse.prototype.token_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientLogonResponse.prototype.family_group_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    CMsgClientLogonResponse.create = function create(properties) {
        return new CMsgClientLogonResponse(properties);
    };

    CMsgClientLogonResponse.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.eresult != null && Object.hasOwnProperty.call(message, "eresult"))
            writer.uint32(8).int32(message.eresult);
        if (message.legacy_out_of_game_heartbeat_seconds != null && Object.hasOwnProperty.call(message, "legacy_out_of_game_heartbeat_seconds"))
            writer.uint32(16).int32(message.legacy_out_of_game_heartbeat_seconds);
        if (message.heartbeat_seconds != null && Object.hasOwnProperty.call(message, "heartbeat_seconds"))
            writer.uint32(24).int32(message.heartbeat_seconds);
        if (message.deprecated_public_ip != null && Object.hasOwnProperty.call(message, "deprecated_public_ip"))
            writer.uint32(32).uint32(message.deprecated_public_ip);
        if (message.rtime32_server_time != null && Object.hasOwnProperty.call(message, "rtime32_server_time"))
            writer.uint32(45).fixed32(message.rtime32_server_time);
        if (message.account_flags != null && Object.hasOwnProperty.call(message, "account_flags"))
            writer.uint32(48).uint32(message.account_flags);
        if (message.cell_id != null && Object.hasOwnProperty.call(message, "cell_id"))
            writer.uint32(56).uint32(message.cell_id);
        if (message.email_domain != null && Object.hasOwnProperty.call(message, "email_domain"))
            writer.uint32(66).string(message.email_domain);
        if (message.steam2_ticket != null && Object.hasOwnProperty.call(message, "steam2_ticket"))
            writer.uint32(74).bytes(message.steam2_ticket);
        if (message.eresult_extended != null && Object.hasOwnProperty.call(message, "eresult_extended"))
            writer.uint32(80).int32(message.eresult_extended);
        if (message.webapi_authenticate_user_nonce != null && Object.hasOwnProperty.call(message, "webapi_authenticate_user_nonce"))
            writer.uint32(90).string(message.webapi_authenticate_user_nonce);
        if (message.cell_id_ping_threshold != null && Object.hasOwnProperty.call(message, "cell_id_ping_threshold"))
            writer.uint32(96).uint32(message.cell_id_ping_threshold);
        if (message.deprecated_use_pics != null && Object.hasOwnProperty.call(message, "deprecated_use_pics"))
            writer.uint32(104).bool(message.deprecated_use_pics);
        if (message.vanity_url != null && Object.hasOwnProperty.call(message, "vanity_url"))
            writer.uint32(114).string(message.vanity_url);
        if (message.public_ip != null && Object.hasOwnProperty.call(message, "public_ip"))
            $root.CMsgIPAddress.encode(message.public_ip, writer.uint32(122).fork(), q + 1).ldelim();
        if (message.user_country != null && Object.hasOwnProperty.call(message, "user_country"))
            writer.uint32(130).string(message.user_country);
        if (message.client_supplied_steamid != null && Object.hasOwnProperty.call(message, "client_supplied_steamid"))
            writer.uint32(161).fixed64(message.client_supplied_steamid);
        if (message.ip_country_code != null && Object.hasOwnProperty.call(message, "ip_country_code"))
            writer.uint32(170).string(message.ip_country_code);
        if (message.parental_settings != null && Object.hasOwnProperty.call(message, "parental_settings"))
            writer.uint32(178).bytes(message.parental_settings);
        if (message.parental_setting_signature != null && Object.hasOwnProperty.call(message, "parental_setting_signature"))
            writer.uint32(186).bytes(message.parental_setting_signature);
        if (message.count_loginfailures_to_migrate != null && Object.hasOwnProperty.call(message, "count_loginfailures_to_migrate"))
            writer.uint32(192).int32(message.count_loginfailures_to_migrate);
        if (message.count_disconnects_to_migrate != null && Object.hasOwnProperty.call(message, "count_disconnects_to_migrate"))
            writer.uint32(200).int32(message.count_disconnects_to_migrate);
        if (message.ogs_data_report_time_window != null && Object.hasOwnProperty.call(message, "ogs_data_report_time_window"))
            writer.uint32(208).int32(message.ogs_data_report_time_window);
        if (message.client_instance_id != null && Object.hasOwnProperty.call(message, "client_instance_id"))
            writer.uint32(216).uint64(message.client_instance_id);
        if (message.force_client_update_check != null && Object.hasOwnProperty.call(message, "force_client_update_check"))
            writer.uint32(224).bool(message.force_client_update_check);
        if (message.agreement_session_url != null && Object.hasOwnProperty.call(message, "agreement_session_url"))
            writer.uint32(234).string(message.agreement_session_url);
        if (message.token_id != null && Object.hasOwnProperty.call(message, "token_id"))
            writer.uint32(240).uint64(message.token_id);
        if (message.family_group_id != null && Object.hasOwnProperty.call(message, "family_group_id"))
            writer.uint32(248).uint64(message.family_group_id);
        return writer;
    };

    CMsgClientLogonResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientLogonResponse();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.eresult = reader.int32();
                    break;
                }
            case 2: {
                    message.legacy_out_of_game_heartbeat_seconds = reader.int32();
                    break;
                }
            case 3: {
                    message.heartbeat_seconds = reader.int32();
                    break;
                }
            case 4: {
                    message.deprecated_public_ip = reader.uint32();
                    break;
                }
            case 5: {
                    message.rtime32_server_time = reader.fixed32();
                    break;
                }
            case 6: {
                    message.account_flags = reader.uint32();
                    break;
                }
            case 7: {
                    message.cell_id = reader.uint32();
                    break;
                }
            case 8: {
                    message.email_domain = reader.string();
                    break;
                }
            case 9: {
                    message.steam2_ticket = reader.bytes();
                    break;
                }
            case 10: {
                    message.eresult_extended = reader.int32();
                    break;
                }
            case 11: {
                    message.webapi_authenticate_user_nonce = reader.string();
                    break;
                }
            case 12: {
                    message.cell_id_ping_threshold = reader.uint32();
                    break;
                }
            case 13: {
                    message.deprecated_use_pics = reader.bool();
                    break;
                }
            case 14: {
                    message.vanity_url = reader.string();
                    break;
                }
            case 15: {
                    message.public_ip = $root.CMsgIPAddress.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            case 16: {
                    message.user_country = reader.string();
                    break;
                }
            case 20: {
                    message.client_supplied_steamid = reader.fixed64();
                    break;
                }
            case 21: {
                    message.ip_country_code = reader.string();
                    break;
                }
            case 22: {
                    message.parental_settings = reader.bytes();
                    break;
                }
            case 23: {
                    message.parental_setting_signature = reader.bytes();
                    break;
                }
            case 24: {
                    message.count_loginfailures_to_migrate = reader.int32();
                    break;
                }
            case 25: {
                    message.count_disconnects_to_migrate = reader.int32();
                    break;
                }
            case 26: {
                    message.ogs_data_report_time_window = reader.int32();
                    break;
                }
            case 27: {
                    message.client_instance_id = reader.uint64();
                    break;
                }
            case 28: {
                    message.force_client_update_check = reader.bool();
                    break;
                }
            case 29: {
                    message.agreement_session_url = reader.string();
                    break;
                }
            case 30: {
                    message.token_id = reader.uint64();
                    break;
                }
            case 31: {
                    message.family_group_id = reader.uint64();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientLogonResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientLogonResponse)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientLogonResponse: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientLogonResponse();
        if (object.eresult != null)
            message.eresult = object.eresult | 0;
        if (object.legacy_out_of_game_heartbeat_seconds != null)
            message.legacy_out_of_game_heartbeat_seconds = object.legacy_out_of_game_heartbeat_seconds | 0;
        if (object.heartbeat_seconds != null)
            message.heartbeat_seconds = object.heartbeat_seconds | 0;
        if (object.deprecated_public_ip != null)
            message.deprecated_public_ip = object.deprecated_public_ip >>> 0;
        if (object.rtime32_server_time != null)
            message.rtime32_server_time = object.rtime32_server_time >>> 0;
        if (object.account_flags != null)
            message.account_flags = object.account_flags >>> 0;
        if (object.cell_id != null)
            message.cell_id = object.cell_id >>> 0;
        if (object.email_domain != null)
            message.email_domain = String(object.email_domain);
        if (object.steam2_ticket != null)
            if (typeof object.steam2_ticket === "string")
                $util.base64.decode(object.steam2_ticket, message.steam2_ticket = $util.newBuffer($util.base64.length(object.steam2_ticket)), 0);
            else if (object.steam2_ticket.length >= 0)
                message.steam2_ticket = object.steam2_ticket;
        if (object.eresult_extended != null)
            message.eresult_extended = object.eresult_extended | 0;
        if (object.webapi_authenticate_user_nonce != null)
            message.webapi_authenticate_user_nonce = String(object.webapi_authenticate_user_nonce);
        if (object.cell_id_ping_threshold != null)
            message.cell_id_ping_threshold = object.cell_id_ping_threshold >>> 0;
        if (object.deprecated_use_pics != null)
            message.deprecated_use_pics = Boolean(object.deprecated_use_pics);
        if (object.vanity_url != null)
            message.vanity_url = String(object.vanity_url);
        if (object.public_ip != null) {
            if (!$util.isObject(object.public_ip))
                throw TypeError(".CMsgClientLogonResponse.public_ip: object expected");
            message.public_ip = $root.CMsgIPAddress.fromObject(object.public_ip, long + 1);
        }
        if (object.user_country != null)
            message.user_country = String(object.user_country);
        if (object.client_supplied_steamid != null)
            if ($util.Long)
                message.client_supplied_steamid = $util.Long.fromValue(object.client_supplied_steamid, true);
            else if (typeof object.client_supplied_steamid === "string")
                message.client_supplied_steamid = parseInt(object.client_supplied_steamid, 10);
            else if (typeof object.client_supplied_steamid === "number")
                message.client_supplied_steamid = object.client_supplied_steamid;
            else if (typeof object.client_supplied_steamid === "object")
                message.client_supplied_steamid = new $util.LongBits(object.client_supplied_steamid.low >>> 0, object.client_supplied_steamid.high >>> 0).toNumber(true);
        if (object.ip_country_code != null)
            message.ip_country_code = String(object.ip_country_code);
        if (object.parental_settings != null)
            if (typeof object.parental_settings === "string")
                $util.base64.decode(object.parental_settings, message.parental_settings = $util.newBuffer($util.base64.length(object.parental_settings)), 0);
            else if (object.parental_settings.length >= 0)
                message.parental_settings = object.parental_settings;
        if (object.parental_setting_signature != null)
            if (typeof object.parental_setting_signature === "string")
                $util.base64.decode(object.parental_setting_signature, message.parental_setting_signature = $util.newBuffer($util.base64.length(object.parental_setting_signature)), 0);
            else if (object.parental_setting_signature.length >= 0)
                message.parental_setting_signature = object.parental_setting_signature;
        if (object.count_loginfailures_to_migrate != null)
            message.count_loginfailures_to_migrate = object.count_loginfailures_to_migrate | 0;
        if (object.count_disconnects_to_migrate != null)
            message.count_disconnects_to_migrate = object.count_disconnects_to_migrate | 0;
        if (object.ogs_data_report_time_window != null)
            message.ogs_data_report_time_window = object.ogs_data_report_time_window | 0;
        if (object.client_instance_id != null)
            if ($util.Long)
                message.client_instance_id = $util.Long.fromValue(object.client_instance_id, true);
            else if (typeof object.client_instance_id === "string")
                message.client_instance_id = parseInt(object.client_instance_id, 10);
            else if (typeof object.client_instance_id === "number")
                message.client_instance_id = object.client_instance_id;
            else if (typeof object.client_instance_id === "object")
                message.client_instance_id = new $util.LongBits(object.client_instance_id.low >>> 0, object.client_instance_id.high >>> 0).toNumber(true);
        if (object.force_client_update_check != null)
            message.force_client_update_check = Boolean(object.force_client_update_check);
        if (object.agreement_session_url != null)
            message.agreement_session_url = String(object.agreement_session_url);
        if (object.token_id != null)
            if ($util.Long)
                message.token_id = $util.Long.fromValue(object.token_id, true);
            else if (typeof object.token_id === "string")
                message.token_id = parseInt(object.token_id, 10);
            else if (typeof object.token_id === "number")
                message.token_id = object.token_id;
            else if (typeof object.token_id === "object")
                message.token_id = new $util.LongBits(object.token_id.low >>> 0, object.token_id.high >>> 0).toNumber(true);
        if (object.family_group_id != null)
            if ($util.Long)
                message.family_group_id = $util.Long.fromValue(object.family_group_id, true);
            else if (typeof object.family_group_id === "string")
                message.family_group_id = parseInt(object.family_group_id, 10);
            else if (typeof object.family_group_id === "number")
                message.family_group_id = object.family_group_id;
            else if (typeof object.family_group_id === "object")
                message.family_group_id = new $util.LongBits(object.family_group_id.low >>> 0, object.family_group_id.high >>> 0).toNumber(true);
        return message;
    };

    CMsgClientLogonResponse.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.eresult = 2;
            object.legacy_out_of_game_heartbeat_seconds = 0;
            object.heartbeat_seconds = 0;
            object.deprecated_public_ip = 0;
            object.rtime32_server_time = 0;
            object.account_flags = 0;
            object.cell_id = 0;
            object.email_domain = "";
            if (options.bytes === String)
                object.steam2_ticket = "";
            else {
                object.steam2_ticket = [];
                if (options.bytes !== Array)
                    object.steam2_ticket = $util.newBuffer(object.steam2_ticket);
            }
            object.eresult_extended = 0;
            object.webapi_authenticate_user_nonce = "";
            object.cell_id_ping_threshold = 0;
            object.deprecated_use_pics = false;
            object.vanity_url = "";
            object.public_ip = null;
            object.user_country = "";
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.client_supplied_steamid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.client_supplied_steamid = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.ip_country_code = "";
            if (options.bytes === String)
                object.parental_settings = "";
            else {
                object.parental_settings = [];
                if (options.bytes !== Array)
                    object.parental_settings = $util.newBuffer(object.parental_settings);
            }
            if (options.bytes === String)
                object.parental_setting_signature = "";
            else {
                object.parental_setting_signature = [];
                if (options.bytes !== Array)
                    object.parental_setting_signature = $util.newBuffer(object.parental_setting_signature);
            }
            object.count_loginfailures_to_migrate = 0;
            object.count_disconnects_to_migrate = 0;
            object.ogs_data_report_time_window = 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.client_instance_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.client_instance_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.force_client_update_check = false;
            object.agreement_session_url = "";
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.token_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.token_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.family_group_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.family_group_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
        }
        if (message.eresult != null && Object.hasOwnProperty.call(message, "eresult"))
            object.eresult = message.eresult;
        if (message.legacy_out_of_game_heartbeat_seconds != null && Object.hasOwnProperty.call(message, "legacy_out_of_game_heartbeat_seconds"))
            object.legacy_out_of_game_heartbeat_seconds = message.legacy_out_of_game_heartbeat_seconds;
        if (message.heartbeat_seconds != null && Object.hasOwnProperty.call(message, "heartbeat_seconds"))
            object.heartbeat_seconds = message.heartbeat_seconds;
        if (message.deprecated_public_ip != null && Object.hasOwnProperty.call(message, "deprecated_public_ip"))
            object.deprecated_public_ip = message.deprecated_public_ip;
        if (message.rtime32_server_time != null && Object.hasOwnProperty.call(message, "rtime32_server_time"))
            object.rtime32_server_time = message.rtime32_server_time;
        if (message.account_flags != null && Object.hasOwnProperty.call(message, "account_flags"))
            object.account_flags = message.account_flags;
        if (message.cell_id != null && Object.hasOwnProperty.call(message, "cell_id"))
            object.cell_id = message.cell_id;
        if (message.email_domain != null && Object.hasOwnProperty.call(message, "email_domain"))
            object.email_domain = message.email_domain;
        if (message.steam2_ticket != null && Object.hasOwnProperty.call(message, "steam2_ticket"))
            object.steam2_ticket = options.bytes === String ? $util.base64.encode(message.steam2_ticket, 0, message.steam2_ticket.length) : options.bytes === Array ? Array.prototype.slice.call(message.steam2_ticket) : message.steam2_ticket;
        if (message.eresult_extended != null && Object.hasOwnProperty.call(message, "eresult_extended"))
            object.eresult_extended = message.eresult_extended;
        if (message.webapi_authenticate_user_nonce != null && Object.hasOwnProperty.call(message, "webapi_authenticate_user_nonce"))
            object.webapi_authenticate_user_nonce = message.webapi_authenticate_user_nonce;
        if (message.cell_id_ping_threshold != null && Object.hasOwnProperty.call(message, "cell_id_ping_threshold"))
            object.cell_id_ping_threshold = message.cell_id_ping_threshold;
        if (message.deprecated_use_pics != null && Object.hasOwnProperty.call(message, "deprecated_use_pics"))
            object.deprecated_use_pics = message.deprecated_use_pics;
        if (message.vanity_url != null && Object.hasOwnProperty.call(message, "vanity_url"))
            object.vanity_url = message.vanity_url;
        if (message.public_ip != null && Object.hasOwnProperty.call(message, "public_ip"))
            object.public_ip = $root.CMsgIPAddress.toObject(message.public_ip, options, q + 1);
        if (message.user_country != null && Object.hasOwnProperty.call(message, "user_country"))
            object.user_country = message.user_country;
        if (message.client_supplied_steamid != null && Object.hasOwnProperty.call(message, "client_supplied_steamid"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.client_supplied_steamid = typeof message.client_supplied_steamid === "number" ? BigInt(message.client_supplied_steamid) : $util.Long.fromBits(message.client_supplied_steamid.low >>> 0, message.client_supplied_steamid.high >>> 0, true).toBigInt();
            else if (typeof message.client_supplied_steamid === "number")
                object.client_supplied_steamid = options.longs === String ? String(message.client_supplied_steamid) : message.client_supplied_steamid;
            else
                object.client_supplied_steamid = options.longs === String ? $util.Long.prototype.toString.call(message.client_supplied_steamid) : options.longs === Number ? new $util.LongBits(message.client_supplied_steamid.low >>> 0, message.client_supplied_steamid.high >>> 0).toNumber(true) : message.client_supplied_steamid;
        if (message.ip_country_code != null && Object.hasOwnProperty.call(message, "ip_country_code"))
            object.ip_country_code = message.ip_country_code;
        if (message.parental_settings != null && Object.hasOwnProperty.call(message, "parental_settings"))
            object.parental_settings = options.bytes === String ? $util.base64.encode(message.parental_settings, 0, message.parental_settings.length) : options.bytes === Array ? Array.prototype.slice.call(message.parental_settings) : message.parental_settings;
        if (message.parental_setting_signature != null && Object.hasOwnProperty.call(message, "parental_setting_signature"))
            object.parental_setting_signature = options.bytes === String ? $util.base64.encode(message.parental_setting_signature, 0, message.parental_setting_signature.length) : options.bytes === Array ? Array.prototype.slice.call(message.parental_setting_signature) : message.parental_setting_signature;
        if (message.count_loginfailures_to_migrate != null && Object.hasOwnProperty.call(message, "count_loginfailures_to_migrate"))
            object.count_loginfailures_to_migrate = message.count_loginfailures_to_migrate;
        if (message.count_disconnects_to_migrate != null && Object.hasOwnProperty.call(message, "count_disconnects_to_migrate"))
            object.count_disconnects_to_migrate = message.count_disconnects_to_migrate;
        if (message.ogs_data_report_time_window != null && Object.hasOwnProperty.call(message, "ogs_data_report_time_window"))
            object.ogs_data_report_time_window = message.ogs_data_report_time_window;
        if (message.client_instance_id != null && Object.hasOwnProperty.call(message, "client_instance_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.client_instance_id = typeof message.client_instance_id === "number" ? BigInt(message.client_instance_id) : $util.Long.fromBits(message.client_instance_id.low >>> 0, message.client_instance_id.high >>> 0, true).toBigInt();
            else if (typeof message.client_instance_id === "number")
                object.client_instance_id = options.longs === String ? String(message.client_instance_id) : message.client_instance_id;
            else
                object.client_instance_id = options.longs === String ? $util.Long.prototype.toString.call(message.client_instance_id) : options.longs === Number ? new $util.LongBits(message.client_instance_id.low >>> 0, message.client_instance_id.high >>> 0).toNumber(true) : message.client_instance_id;
        if (message.force_client_update_check != null && Object.hasOwnProperty.call(message, "force_client_update_check"))
            object.force_client_update_check = message.force_client_update_check;
        if (message.agreement_session_url != null && Object.hasOwnProperty.call(message, "agreement_session_url"))
            object.agreement_session_url = message.agreement_session_url;
        if (message.token_id != null && Object.hasOwnProperty.call(message, "token_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.token_id = typeof message.token_id === "number" ? BigInt(message.token_id) : $util.Long.fromBits(message.token_id.low >>> 0, message.token_id.high >>> 0, true).toBigInt();
            else if (typeof message.token_id === "number")
                object.token_id = options.longs === String ? String(message.token_id) : message.token_id;
            else
                object.token_id = options.longs === String ? $util.Long.prototype.toString.call(message.token_id) : options.longs === Number ? new $util.LongBits(message.token_id.low >>> 0, message.token_id.high >>> 0).toNumber(true) : message.token_id;
        if (message.family_group_id != null && Object.hasOwnProperty.call(message, "family_group_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.family_group_id = typeof message.family_group_id === "number" ? BigInt(message.family_group_id) : $util.Long.fromBits(message.family_group_id.low >>> 0, message.family_group_id.high >>> 0, true).toBigInt();
            else if (typeof message.family_group_id === "number")
                object.family_group_id = options.longs === String ? String(message.family_group_id) : message.family_group_id;
            else
                object.family_group_id = options.longs === String ? $util.Long.prototype.toString.call(message.family_group_id) : options.longs === Number ? new $util.LongBits(message.family_group_id.low >>> 0, message.family_group_id.high >>> 0).toNumber(true) : message.family_group_id;
        return object;
    };

    CMsgClientLogonResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientLogonResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientLogonResponse";
    };

    return CMsgClientLogonResponse;
})();

export const CMsgClientLoggedOff = $root.CMsgClientLoggedOff = (() => {

    function CMsgClientLoggedOff(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientLoggedOff.prototype.eresult = 2;

    CMsgClientLoggedOff.create = function create(properties) {
        return new CMsgClientLoggedOff(properties);
    };

    CMsgClientLoggedOff.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.eresult != null && Object.hasOwnProperty.call(message, "eresult"))
            writer.uint32(8).int32(message.eresult);
        return writer;
    };

    CMsgClientLoggedOff.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientLoggedOff();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.eresult = reader.int32();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientLoggedOff.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientLoggedOff)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientLoggedOff: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientLoggedOff();
        if (object.eresult != null)
            message.eresult = object.eresult | 0;
        return message;
    };

    CMsgClientLoggedOff.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults)
            object.eresult = 2;
        if (message.eresult != null && Object.hasOwnProperty.call(message, "eresult"))
            object.eresult = message.eresult;
        return object;
    };

    CMsgClientLoggedOff.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientLoggedOff.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientLoggedOff";
    };

    return CMsgClientLoggedOff;
})();

export const CMsgClientHeartBeat = $root.CMsgClientHeartBeat = (() => {

    function CMsgClientHeartBeat(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientHeartBeat.prototype.send_reply = false;

    CMsgClientHeartBeat.create = function create(properties) {
        return new CMsgClientHeartBeat(properties);
    };

    CMsgClientHeartBeat.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.send_reply != null && Object.hasOwnProperty.call(message, "send_reply"))
            writer.uint32(8).bool(message.send_reply);
        return writer;
    };

    CMsgClientHeartBeat.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientHeartBeat();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.send_reply = reader.bool();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientHeartBeat.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientHeartBeat)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientHeartBeat: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientHeartBeat();
        if (object.send_reply != null)
            message.send_reply = Boolean(object.send_reply);
        return message;
    };

    CMsgClientHeartBeat.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults)
            object.send_reply = false;
        if (message.send_reply != null && Object.hasOwnProperty.call(message, "send_reply"))
            object.send_reply = message.send_reply;
        return object;
    };

    CMsgClientHeartBeat.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientHeartBeat.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientHeartBeat";
    };

    return CMsgClientHeartBeat;
})();

export const CMsgClientAccountInfo = $root.CMsgClientAccountInfo = (() => {

    function CMsgClientAccountInfo(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientAccountInfo.prototype.persona_name = "";
    CMsgClientAccountInfo.prototype.ip_country = "";
    CMsgClientAccountInfo.prototype.count_authed_computers = 0;
    CMsgClientAccountInfo.prototype.account_flags = 0;
    CMsgClientAccountInfo.prototype.facebook_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientAccountInfo.prototype.facebook_name = "";
    CMsgClientAccountInfo.prototype.steamguard_notify_newmachines = false;
    CMsgClientAccountInfo.prototype.steamguard_machine_name_user_chosen = "";
    CMsgClientAccountInfo.prototype.is_phone_verified = false;
    CMsgClientAccountInfo.prototype.two_factor_state = 0;
    CMsgClientAccountInfo.prototype.is_phone_identifying = false;
    CMsgClientAccountInfo.prototype.is_phone_needing_reverify = false;

    CMsgClientAccountInfo.create = function create(properties) {
        return new CMsgClientAccountInfo(properties);
    };

    CMsgClientAccountInfo.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.persona_name != null && Object.hasOwnProperty.call(message, "persona_name"))
            writer.uint32(10).string(message.persona_name);
        if (message.ip_country != null && Object.hasOwnProperty.call(message, "ip_country"))
            writer.uint32(18).string(message.ip_country);
        if (message.count_authed_computers != null && Object.hasOwnProperty.call(message, "count_authed_computers"))
            writer.uint32(40).int32(message.count_authed_computers);
        if (message.account_flags != null && Object.hasOwnProperty.call(message, "account_flags"))
            writer.uint32(56).uint32(message.account_flags);
        if (message.facebook_id != null && Object.hasOwnProperty.call(message, "facebook_id"))
            writer.uint32(64).uint64(message.facebook_id);
        if (message.facebook_name != null && Object.hasOwnProperty.call(message, "facebook_name"))
            writer.uint32(74).string(message.facebook_name);
        if (message.steamguard_notify_newmachines != null && Object.hasOwnProperty.call(message, "steamguard_notify_newmachines"))
            writer.uint32(112).bool(message.steamguard_notify_newmachines);
        if (message.steamguard_machine_name_user_chosen != null && Object.hasOwnProperty.call(message, "steamguard_machine_name_user_chosen"))
            writer.uint32(122).string(message.steamguard_machine_name_user_chosen);
        if (message.is_phone_verified != null && Object.hasOwnProperty.call(message, "is_phone_verified"))
            writer.uint32(128).bool(message.is_phone_verified);
        if (message.two_factor_state != null && Object.hasOwnProperty.call(message, "two_factor_state"))
            writer.uint32(136).uint32(message.two_factor_state);
        if (message.is_phone_identifying != null && Object.hasOwnProperty.call(message, "is_phone_identifying"))
            writer.uint32(144).bool(message.is_phone_identifying);
        if (message.is_phone_needing_reverify != null && Object.hasOwnProperty.call(message, "is_phone_needing_reverify"))
            writer.uint32(152).bool(message.is_phone_needing_reverify);
        return writer;
    };

    CMsgClientAccountInfo.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientAccountInfo();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.persona_name = reader.string();
                    break;
                }
            case 2: {
                    message.ip_country = reader.string();
                    break;
                }
            case 5: {
                    message.count_authed_computers = reader.int32();
                    break;
                }
            case 7: {
                    message.account_flags = reader.uint32();
                    break;
                }
            case 8: {
                    message.facebook_id = reader.uint64();
                    break;
                }
            case 9: {
                    message.facebook_name = reader.string();
                    break;
                }
            case 14: {
                    message.steamguard_notify_newmachines = reader.bool();
                    break;
                }
            case 15: {
                    message.steamguard_machine_name_user_chosen = reader.string();
                    break;
                }
            case 16: {
                    message.is_phone_verified = reader.bool();
                    break;
                }
            case 17: {
                    message.two_factor_state = reader.uint32();
                    break;
                }
            case 18: {
                    message.is_phone_identifying = reader.bool();
                    break;
                }
            case 19: {
                    message.is_phone_needing_reverify = reader.bool();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientAccountInfo.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientAccountInfo)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientAccountInfo: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientAccountInfo();
        if (object.persona_name != null)
            message.persona_name = String(object.persona_name);
        if (object.ip_country != null)
            message.ip_country = String(object.ip_country);
        if (object.count_authed_computers != null)
            message.count_authed_computers = object.count_authed_computers | 0;
        if (object.account_flags != null)
            message.account_flags = object.account_flags >>> 0;
        if (object.facebook_id != null)
            if ($util.Long)
                message.facebook_id = $util.Long.fromValue(object.facebook_id, true);
            else if (typeof object.facebook_id === "string")
                message.facebook_id = parseInt(object.facebook_id, 10);
            else if (typeof object.facebook_id === "number")
                message.facebook_id = object.facebook_id;
            else if (typeof object.facebook_id === "object")
                message.facebook_id = new $util.LongBits(object.facebook_id.low >>> 0, object.facebook_id.high >>> 0).toNumber(true);
        if (object.facebook_name != null)
            message.facebook_name = String(object.facebook_name);
        if (object.steamguard_notify_newmachines != null)
            message.steamguard_notify_newmachines = Boolean(object.steamguard_notify_newmachines);
        if (object.steamguard_machine_name_user_chosen != null)
            message.steamguard_machine_name_user_chosen = String(object.steamguard_machine_name_user_chosen);
        if (object.is_phone_verified != null)
            message.is_phone_verified = Boolean(object.is_phone_verified);
        if (object.two_factor_state != null)
            message.two_factor_state = object.two_factor_state >>> 0;
        if (object.is_phone_identifying != null)
            message.is_phone_identifying = Boolean(object.is_phone_identifying);
        if (object.is_phone_needing_reverify != null)
            message.is_phone_needing_reverify = Boolean(object.is_phone_needing_reverify);
        return message;
    };

    CMsgClientAccountInfo.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.persona_name = "";
            object.ip_country = "";
            object.count_authed_computers = 0;
            object.account_flags = 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.facebook_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.facebook_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.facebook_name = "";
            object.steamguard_notify_newmachines = false;
            object.steamguard_machine_name_user_chosen = "";
            object.is_phone_verified = false;
            object.two_factor_state = 0;
            object.is_phone_identifying = false;
            object.is_phone_needing_reverify = false;
        }
        if (message.persona_name != null && Object.hasOwnProperty.call(message, "persona_name"))
            object.persona_name = message.persona_name;
        if (message.ip_country != null && Object.hasOwnProperty.call(message, "ip_country"))
            object.ip_country = message.ip_country;
        if (message.count_authed_computers != null && Object.hasOwnProperty.call(message, "count_authed_computers"))
            object.count_authed_computers = message.count_authed_computers;
        if (message.account_flags != null && Object.hasOwnProperty.call(message, "account_flags"))
            object.account_flags = message.account_flags;
        if (message.facebook_id != null && Object.hasOwnProperty.call(message, "facebook_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.facebook_id = typeof message.facebook_id === "number" ? BigInt(message.facebook_id) : $util.Long.fromBits(message.facebook_id.low >>> 0, message.facebook_id.high >>> 0, true).toBigInt();
            else if (typeof message.facebook_id === "number")
                object.facebook_id = options.longs === String ? String(message.facebook_id) : message.facebook_id;
            else
                object.facebook_id = options.longs === String ? $util.Long.prototype.toString.call(message.facebook_id) : options.longs === Number ? new $util.LongBits(message.facebook_id.low >>> 0, message.facebook_id.high >>> 0).toNumber(true) : message.facebook_id;
        if (message.facebook_name != null && Object.hasOwnProperty.call(message, "facebook_name"))
            object.facebook_name = message.facebook_name;
        if (message.steamguard_notify_newmachines != null && Object.hasOwnProperty.call(message, "steamguard_notify_newmachines"))
            object.steamguard_notify_newmachines = message.steamguard_notify_newmachines;
        if (message.steamguard_machine_name_user_chosen != null && Object.hasOwnProperty.call(message, "steamguard_machine_name_user_chosen"))
            object.steamguard_machine_name_user_chosen = message.steamguard_machine_name_user_chosen;
        if (message.is_phone_verified != null && Object.hasOwnProperty.call(message, "is_phone_verified"))
            object.is_phone_verified = message.is_phone_verified;
        if (message.two_factor_state != null && Object.hasOwnProperty.call(message, "two_factor_state"))
            object.two_factor_state = message.two_factor_state;
        if (message.is_phone_identifying != null && Object.hasOwnProperty.call(message, "is_phone_identifying"))
            object.is_phone_identifying = message.is_phone_identifying;
        if (message.is_phone_needing_reverify != null && Object.hasOwnProperty.call(message, "is_phone_needing_reverify"))
            object.is_phone_needing_reverify = message.is_phone_needing_reverify;
        return object;
    };

    CMsgClientAccountInfo.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientAccountInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientAccountInfo";
    };

    return CMsgClientAccountInfo;
})();

export const CMsgClientGamesPlayed = $root.CMsgClientGamesPlayed = (() => {

    function CMsgClientGamesPlayed(properties) {
        this.games_played = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientGamesPlayed.prototype.games_played = $util.emptyArray;
    CMsgClientGamesPlayed.prototype.client_os_type = 0;
    CMsgClientGamesPlayed.prototype.cloud_gaming_platform = 0;

    CMsgClientGamesPlayed.create = function create(properties) {
        return new CMsgClientGamesPlayed(properties);
    };

    CMsgClientGamesPlayed.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.games_played != null && message.games_played.length)
            for (let i = 0; i < message.games_played.length; ++i)
                $root.CMsgClientGamesPlayed_GamePlayed.encode(message.games_played[i], writer.uint32(10).fork(), q + 1).ldelim();
        if (message.client_os_type != null && Object.hasOwnProperty.call(message, "client_os_type"))
            writer.uint32(16).uint32(message.client_os_type);
        if (message.cloud_gaming_platform != null && Object.hasOwnProperty.call(message, "cloud_gaming_platform"))
            writer.uint32(24).uint32(message.cloud_gaming_platform);
        return writer;
    };

    CMsgClientGamesPlayed.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientGamesPlayed();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    if (!(message.games_played && message.games_played.length))
                        message.games_played = [];
                    message.games_played.push($root.CMsgClientGamesPlayed_GamePlayed.decode(reader, reader.uint32(), undefined, long + 1));
                    break;
                }
            case 2: {
                    message.client_os_type = reader.uint32();
                    break;
                }
            case 3: {
                    message.cloud_gaming_platform = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientGamesPlayed.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientGamesPlayed)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientGamesPlayed: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientGamesPlayed();
        if (object.games_played) {
            if (!Array.isArray(object.games_played))
                throw TypeError(".CMsgClientGamesPlayed.games_played: array expected");
            message.games_played = [];
            for (let i = 0; i < object.games_played.length; ++i) {
                if (!$util.isObject(object.games_played[i]))
                    throw TypeError(".CMsgClientGamesPlayed.games_played: object expected");
                message.games_played[i] = $root.CMsgClientGamesPlayed_GamePlayed.fromObject(object.games_played[i], long + 1);
            }
        }
        if (object.client_os_type != null)
            message.client_os_type = object.client_os_type >>> 0;
        if (object.cloud_gaming_platform != null)
            message.cloud_gaming_platform = object.cloud_gaming_platform >>> 0;
        return message;
    };

    CMsgClientGamesPlayed.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.arrays || options.defaults)
            object.games_played = [];
        if (options.defaults) {
            object.client_os_type = 0;
            object.cloud_gaming_platform = 0;
        }
        if (message.games_played && message.games_played.length) {
            object.games_played = [];
            for (let j = 0; j < message.games_played.length; ++j)
                object.games_played[j] = $root.CMsgClientGamesPlayed_GamePlayed.toObject(message.games_played[j], options, q + 1);
        }
        if (message.client_os_type != null && Object.hasOwnProperty.call(message, "client_os_type"))
            object.client_os_type = message.client_os_type;
        if (message.cloud_gaming_platform != null && Object.hasOwnProperty.call(message, "cloud_gaming_platform"))
            object.cloud_gaming_platform = message.cloud_gaming_platform;
        return object;
    };

    CMsgClientGamesPlayed.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientGamesPlayed.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientGamesPlayed";
    };

    return CMsgClientGamesPlayed;
})();

export const CMsgClientGamesPlayed_GamePlayed = $root.CMsgClientGamesPlayed_GamePlayed = (() => {

    function CMsgClientGamesPlayed_GamePlayed(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientGamesPlayed_GamePlayed.prototype.steam_id_gs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.game_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.deprecated_game_ip_address = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.game_port = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.is_secure = false;
    CMsgClientGamesPlayed_GamePlayed.prototype.token = $util.newBuffer([]);
    CMsgClientGamesPlayed_GamePlayed.prototype.game_extra_info = "";
    CMsgClientGamesPlayed_GamePlayed.prototype.game_data_blob = $util.newBuffer([]);
    CMsgClientGamesPlayed_GamePlayed.prototype.process_id = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.streaming_provider_id = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.game_flags = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.owner_id = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.vr_hmd_vendor = "";
    CMsgClientGamesPlayed_GamePlayed.prototype.vr_hmd_model = "";
    CMsgClientGamesPlayed_GamePlayed.prototype.launch_option_type = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.primary_controller_type = -1;
    CMsgClientGamesPlayed_GamePlayed.prototype.primary_steam_controller_serial = "";
    CMsgClientGamesPlayed_GamePlayed.prototype.total_steam_controller_count = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.total_non_steam_controller_count = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.controller_workshop_file_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.launch_source = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.vr_hmd_runtime = 0;
    CMsgClientGamesPlayed_GamePlayed.prototype.game_ip_address = null;
    CMsgClientGamesPlayed_GamePlayed.prototype.controller_connection_type = 0;

    CMsgClientGamesPlayed_GamePlayed.create = function create(properties) {
        return new CMsgClientGamesPlayed_GamePlayed(properties);
    };

    CMsgClientGamesPlayed_GamePlayed.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.steam_id_gs != null && Object.hasOwnProperty.call(message, "steam_id_gs"))
            writer.uint32(8).uint64(message.steam_id_gs);
        if (message.game_id != null && Object.hasOwnProperty.call(message, "game_id"))
            writer.uint32(17).fixed64(message.game_id);
        if (message.deprecated_game_ip_address != null && Object.hasOwnProperty.call(message, "deprecated_game_ip_address"))
            writer.uint32(24).uint32(message.deprecated_game_ip_address);
        if (message.game_port != null && Object.hasOwnProperty.call(message, "game_port"))
            writer.uint32(32).uint32(message.game_port);
        if (message.is_secure != null && Object.hasOwnProperty.call(message, "is_secure"))
            writer.uint32(40).bool(message.is_secure);
        if (message.token != null && Object.hasOwnProperty.call(message, "token"))
            writer.uint32(50).bytes(message.token);
        if (message.game_extra_info != null && Object.hasOwnProperty.call(message, "game_extra_info"))
            writer.uint32(58).string(message.game_extra_info);
        if (message.game_data_blob != null && Object.hasOwnProperty.call(message, "game_data_blob"))
            writer.uint32(66).bytes(message.game_data_blob);
        if (message.process_id != null && Object.hasOwnProperty.call(message, "process_id"))
            writer.uint32(72).uint32(message.process_id);
        if (message.streaming_provider_id != null && Object.hasOwnProperty.call(message, "streaming_provider_id"))
            writer.uint32(80).uint32(message.streaming_provider_id);
        if (message.game_flags != null && Object.hasOwnProperty.call(message, "game_flags"))
            writer.uint32(88).uint32(message.game_flags);
        if (message.owner_id != null && Object.hasOwnProperty.call(message, "owner_id"))
            writer.uint32(96).uint32(message.owner_id);
        if (message.vr_hmd_vendor != null && Object.hasOwnProperty.call(message, "vr_hmd_vendor"))
            writer.uint32(106).string(message.vr_hmd_vendor);
        if (message.vr_hmd_model != null && Object.hasOwnProperty.call(message, "vr_hmd_model"))
            writer.uint32(114).string(message.vr_hmd_model);
        if (message.launch_option_type != null && Object.hasOwnProperty.call(message, "launch_option_type"))
            writer.uint32(120).uint32(message.launch_option_type);
        if (message.primary_controller_type != null && Object.hasOwnProperty.call(message, "primary_controller_type"))
            writer.uint32(128).int32(message.primary_controller_type);
        if (message.primary_steam_controller_serial != null && Object.hasOwnProperty.call(message, "primary_steam_controller_serial"))
            writer.uint32(138).string(message.primary_steam_controller_serial);
        if (message.total_steam_controller_count != null && Object.hasOwnProperty.call(message, "total_steam_controller_count"))
            writer.uint32(144).uint32(message.total_steam_controller_count);
        if (message.total_non_steam_controller_count != null && Object.hasOwnProperty.call(message, "total_non_steam_controller_count"))
            writer.uint32(152).uint32(message.total_non_steam_controller_count);
        if (message.controller_workshop_file_id != null && Object.hasOwnProperty.call(message, "controller_workshop_file_id"))
            writer.uint32(160).uint64(message.controller_workshop_file_id);
        if (message.launch_source != null && Object.hasOwnProperty.call(message, "launch_source"))
            writer.uint32(168).uint32(message.launch_source);
        if (message.vr_hmd_runtime != null && Object.hasOwnProperty.call(message, "vr_hmd_runtime"))
            writer.uint32(176).uint32(message.vr_hmd_runtime);
        if (message.game_ip_address != null && Object.hasOwnProperty.call(message, "game_ip_address"))
            $root.CMsgIPAddress.encode(message.game_ip_address, writer.uint32(186).fork(), q + 1).ldelim();
        if (message.controller_connection_type != null && Object.hasOwnProperty.call(message, "controller_connection_type"))
            writer.uint32(192).uint32(message.controller_connection_type);
        return writer;
    };

    CMsgClientGamesPlayed_GamePlayed.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientGamesPlayed_GamePlayed();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.steam_id_gs = reader.uint64();
                    break;
                }
            case 2: {
                    message.game_id = reader.fixed64();
                    break;
                }
            case 3: {
                    message.deprecated_game_ip_address = reader.uint32();
                    break;
                }
            case 4: {
                    message.game_port = reader.uint32();
                    break;
                }
            case 5: {
                    message.is_secure = reader.bool();
                    break;
                }
            case 6: {
                    message.token = reader.bytes();
                    break;
                }
            case 7: {
                    message.game_extra_info = reader.string();
                    break;
                }
            case 8: {
                    message.game_data_blob = reader.bytes();
                    break;
                }
            case 9: {
                    message.process_id = reader.uint32();
                    break;
                }
            case 10: {
                    message.streaming_provider_id = reader.uint32();
                    break;
                }
            case 11: {
                    message.game_flags = reader.uint32();
                    break;
                }
            case 12: {
                    message.owner_id = reader.uint32();
                    break;
                }
            case 13: {
                    message.vr_hmd_vendor = reader.string();
                    break;
                }
            case 14: {
                    message.vr_hmd_model = reader.string();
                    break;
                }
            case 15: {
                    message.launch_option_type = reader.uint32();
                    break;
                }
            case 16: {
                    message.primary_controller_type = reader.int32();
                    break;
                }
            case 17: {
                    message.primary_steam_controller_serial = reader.string();
                    break;
                }
            case 18: {
                    message.total_steam_controller_count = reader.uint32();
                    break;
                }
            case 19: {
                    message.total_non_steam_controller_count = reader.uint32();
                    break;
                }
            case 20: {
                    message.controller_workshop_file_id = reader.uint64();
                    break;
                }
            case 21: {
                    message.launch_source = reader.uint32();
                    break;
                }
            case 22: {
                    message.vr_hmd_runtime = reader.uint32();
                    break;
                }
            case 23: {
                    message.game_ip_address = $root.CMsgIPAddress.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            case 24: {
                    message.controller_connection_type = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientGamesPlayed_GamePlayed.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientGamesPlayed_GamePlayed)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientGamesPlayed_GamePlayed: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientGamesPlayed_GamePlayed();
        if (object.steam_id_gs != null)
            if ($util.Long)
                message.steam_id_gs = $util.Long.fromValue(object.steam_id_gs, true);
            else if (typeof object.steam_id_gs === "string")
                message.steam_id_gs = parseInt(object.steam_id_gs, 10);
            else if (typeof object.steam_id_gs === "number")
                message.steam_id_gs = object.steam_id_gs;
            else if (typeof object.steam_id_gs === "object")
                message.steam_id_gs = new $util.LongBits(object.steam_id_gs.low >>> 0, object.steam_id_gs.high >>> 0).toNumber(true);
        if (object.game_id != null)
            if ($util.Long)
                message.game_id = $util.Long.fromValue(object.game_id, true);
            else if (typeof object.game_id === "string")
                message.game_id = parseInt(object.game_id, 10);
            else if (typeof object.game_id === "number")
                message.game_id = object.game_id;
            else if (typeof object.game_id === "object")
                message.game_id = new $util.LongBits(object.game_id.low >>> 0, object.game_id.high >>> 0).toNumber(true);
        if (object.deprecated_game_ip_address != null)
            message.deprecated_game_ip_address = object.deprecated_game_ip_address >>> 0;
        if (object.game_port != null)
            message.game_port = object.game_port >>> 0;
        if (object.is_secure != null)
            message.is_secure = Boolean(object.is_secure);
        if (object.token != null)
            if (typeof object.token === "string")
                $util.base64.decode(object.token, message.token = $util.newBuffer($util.base64.length(object.token)), 0);
            else if (object.token.length >= 0)
                message.token = object.token;
        if (object.game_extra_info != null)
            message.game_extra_info = String(object.game_extra_info);
        if (object.game_data_blob != null)
            if (typeof object.game_data_blob === "string")
                $util.base64.decode(object.game_data_blob, message.game_data_blob = $util.newBuffer($util.base64.length(object.game_data_blob)), 0);
            else if (object.game_data_blob.length >= 0)
                message.game_data_blob = object.game_data_blob;
        if (object.process_id != null)
            message.process_id = object.process_id >>> 0;
        if (object.streaming_provider_id != null)
            message.streaming_provider_id = object.streaming_provider_id >>> 0;
        if (object.game_flags != null)
            message.game_flags = object.game_flags >>> 0;
        if (object.owner_id != null)
            message.owner_id = object.owner_id >>> 0;
        if (object.vr_hmd_vendor != null)
            message.vr_hmd_vendor = String(object.vr_hmd_vendor);
        if (object.vr_hmd_model != null)
            message.vr_hmd_model = String(object.vr_hmd_model);
        if (object.launch_option_type != null)
            message.launch_option_type = object.launch_option_type >>> 0;
        if (object.primary_controller_type != null)
            message.primary_controller_type = object.primary_controller_type | 0;
        if (object.primary_steam_controller_serial != null)
            message.primary_steam_controller_serial = String(object.primary_steam_controller_serial);
        if (object.total_steam_controller_count != null)
            message.total_steam_controller_count = object.total_steam_controller_count >>> 0;
        if (object.total_non_steam_controller_count != null)
            message.total_non_steam_controller_count = object.total_non_steam_controller_count >>> 0;
        if (object.controller_workshop_file_id != null)
            if ($util.Long)
                message.controller_workshop_file_id = $util.Long.fromValue(object.controller_workshop_file_id, true);
            else if (typeof object.controller_workshop_file_id === "string")
                message.controller_workshop_file_id = parseInt(object.controller_workshop_file_id, 10);
            else if (typeof object.controller_workshop_file_id === "number")
                message.controller_workshop_file_id = object.controller_workshop_file_id;
            else if (typeof object.controller_workshop_file_id === "object")
                message.controller_workshop_file_id = new $util.LongBits(object.controller_workshop_file_id.low >>> 0, object.controller_workshop_file_id.high >>> 0).toNumber(true);
        if (object.launch_source != null)
            message.launch_source = object.launch_source >>> 0;
        if (object.vr_hmd_runtime != null)
            message.vr_hmd_runtime = object.vr_hmd_runtime >>> 0;
        if (object.game_ip_address != null) {
            if (!$util.isObject(object.game_ip_address))
                throw TypeError(".CMsgClientGamesPlayed_GamePlayed.game_ip_address: object expected");
            message.game_ip_address = $root.CMsgIPAddress.fromObject(object.game_ip_address, long + 1);
        }
        if (object.controller_connection_type != null)
            message.controller_connection_type = object.controller_connection_type >>> 0;
        return message;
    };

    CMsgClientGamesPlayed_GamePlayed.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.steam_id_gs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.steam_id_gs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.game_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.game_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.deprecated_game_ip_address = 0;
            object.game_port = 0;
            object.is_secure = false;
            if (options.bytes === String)
                object.token = "";
            else {
                object.token = [];
                if (options.bytes !== Array)
                    object.token = $util.newBuffer(object.token);
            }
            object.game_extra_info = "";
            if (options.bytes === String)
                object.game_data_blob = "";
            else {
                object.game_data_blob = [];
                if (options.bytes !== Array)
                    object.game_data_blob = $util.newBuffer(object.game_data_blob);
            }
            object.process_id = 0;
            object.streaming_provider_id = 0;
            object.game_flags = 0;
            object.owner_id = 0;
            object.vr_hmd_vendor = "";
            object.vr_hmd_model = "";
            object.launch_option_type = 0;
            object.primary_controller_type = -1;
            object.primary_steam_controller_serial = "";
            object.total_steam_controller_count = 0;
            object.total_non_steam_controller_count = 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.controller_workshop_file_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.controller_workshop_file_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.launch_source = 0;
            object.vr_hmd_runtime = 0;
            object.game_ip_address = null;
            object.controller_connection_type = 0;
        }
        if (message.steam_id_gs != null && Object.hasOwnProperty.call(message, "steam_id_gs"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.steam_id_gs = typeof message.steam_id_gs === "number" ? BigInt(message.steam_id_gs) : $util.Long.fromBits(message.steam_id_gs.low >>> 0, message.steam_id_gs.high >>> 0, true).toBigInt();
            else if (typeof message.steam_id_gs === "number")
                object.steam_id_gs = options.longs === String ? String(message.steam_id_gs) : message.steam_id_gs;
            else
                object.steam_id_gs = options.longs === String ? $util.Long.prototype.toString.call(message.steam_id_gs) : options.longs === Number ? new $util.LongBits(message.steam_id_gs.low >>> 0, message.steam_id_gs.high >>> 0).toNumber(true) : message.steam_id_gs;
        if (message.game_id != null && Object.hasOwnProperty.call(message, "game_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.game_id = typeof message.game_id === "number" ? BigInt(message.game_id) : $util.Long.fromBits(message.game_id.low >>> 0, message.game_id.high >>> 0, true).toBigInt();
            else if (typeof message.game_id === "number")
                object.game_id = options.longs === String ? String(message.game_id) : message.game_id;
            else
                object.game_id = options.longs === String ? $util.Long.prototype.toString.call(message.game_id) : options.longs === Number ? new $util.LongBits(message.game_id.low >>> 0, message.game_id.high >>> 0).toNumber(true) : message.game_id;
        if (message.deprecated_game_ip_address != null && Object.hasOwnProperty.call(message, "deprecated_game_ip_address"))
            object.deprecated_game_ip_address = message.deprecated_game_ip_address;
        if (message.game_port != null && Object.hasOwnProperty.call(message, "game_port"))
            object.game_port = message.game_port;
        if (message.is_secure != null && Object.hasOwnProperty.call(message, "is_secure"))
            object.is_secure = message.is_secure;
        if (message.token != null && Object.hasOwnProperty.call(message, "token"))
            object.token = options.bytes === String ? $util.base64.encode(message.token, 0, message.token.length) : options.bytes === Array ? Array.prototype.slice.call(message.token) : message.token;
        if (message.game_extra_info != null && Object.hasOwnProperty.call(message, "game_extra_info"))
            object.game_extra_info = message.game_extra_info;
        if (message.game_data_blob != null && Object.hasOwnProperty.call(message, "game_data_blob"))
            object.game_data_blob = options.bytes === String ? $util.base64.encode(message.game_data_blob, 0, message.game_data_blob.length) : options.bytes === Array ? Array.prototype.slice.call(message.game_data_blob) : message.game_data_blob;
        if (message.process_id != null && Object.hasOwnProperty.call(message, "process_id"))
            object.process_id = message.process_id;
        if (message.streaming_provider_id != null && Object.hasOwnProperty.call(message, "streaming_provider_id"))
            object.streaming_provider_id = message.streaming_provider_id;
        if (message.game_flags != null && Object.hasOwnProperty.call(message, "game_flags"))
            object.game_flags = message.game_flags;
        if (message.owner_id != null && Object.hasOwnProperty.call(message, "owner_id"))
            object.owner_id = message.owner_id;
        if (message.vr_hmd_vendor != null && Object.hasOwnProperty.call(message, "vr_hmd_vendor"))
            object.vr_hmd_vendor = message.vr_hmd_vendor;
        if (message.vr_hmd_model != null && Object.hasOwnProperty.call(message, "vr_hmd_model"))
            object.vr_hmd_model = message.vr_hmd_model;
        if (message.launch_option_type != null && Object.hasOwnProperty.call(message, "launch_option_type"))
            object.launch_option_type = message.launch_option_type;
        if (message.primary_controller_type != null && Object.hasOwnProperty.call(message, "primary_controller_type"))
            object.primary_controller_type = message.primary_controller_type;
        if (message.primary_steam_controller_serial != null && Object.hasOwnProperty.call(message, "primary_steam_controller_serial"))
            object.primary_steam_controller_serial = message.primary_steam_controller_serial;
        if (message.total_steam_controller_count != null && Object.hasOwnProperty.call(message, "total_steam_controller_count"))
            object.total_steam_controller_count = message.total_steam_controller_count;
        if (message.total_non_steam_controller_count != null && Object.hasOwnProperty.call(message, "total_non_steam_controller_count"))
            object.total_non_steam_controller_count = message.total_non_steam_controller_count;
        if (message.controller_workshop_file_id != null && Object.hasOwnProperty.call(message, "controller_workshop_file_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.controller_workshop_file_id = typeof message.controller_workshop_file_id === "number" ? BigInt(message.controller_workshop_file_id) : $util.Long.fromBits(message.controller_workshop_file_id.low >>> 0, message.controller_workshop_file_id.high >>> 0, true).toBigInt();
            else if (typeof message.controller_workshop_file_id === "number")
                object.controller_workshop_file_id = options.longs === String ? String(message.controller_workshop_file_id) : message.controller_workshop_file_id;
            else
                object.controller_workshop_file_id = options.longs === String ? $util.Long.prototype.toString.call(message.controller_workshop_file_id) : options.longs === Number ? new $util.LongBits(message.controller_workshop_file_id.low >>> 0, message.controller_workshop_file_id.high >>> 0).toNumber(true) : message.controller_workshop_file_id;
        if (message.launch_source != null && Object.hasOwnProperty.call(message, "launch_source"))
            object.launch_source = message.launch_source;
        if (message.vr_hmd_runtime != null && Object.hasOwnProperty.call(message, "vr_hmd_runtime"))
            object.vr_hmd_runtime = message.vr_hmd_runtime;
        if (message.game_ip_address != null && Object.hasOwnProperty.call(message, "game_ip_address"))
            object.game_ip_address = $root.CMsgIPAddress.toObject(message.game_ip_address, options, q + 1);
        if (message.controller_connection_type != null && Object.hasOwnProperty.call(message, "controller_connection_type"))
            object.controller_connection_type = message.controller_connection_type;
        return object;
    };

    CMsgClientGamesPlayed_GamePlayed.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientGamesPlayed_GamePlayed.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientGamesPlayed_GamePlayed";
    };

    return CMsgClientGamesPlayed_GamePlayed;
})();

export const CMsgClientChangeStatus = $root.CMsgClientChangeStatus = (() => {

    function CMsgClientChangeStatus(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientChangeStatus.prototype.persona_state = 0;
    CMsgClientChangeStatus.prototype.player_name = "";
    CMsgClientChangeStatus.prototype.is_auto_generated_name = false;
    CMsgClientChangeStatus.prototype.high_priority = false;
    CMsgClientChangeStatus.prototype.persona_set_by_user = false;
    CMsgClientChangeStatus.prototype.persona_state_flags = 0;
    CMsgClientChangeStatus.prototype.need_persona_response = false;
    CMsgClientChangeStatus.prototype.is_client_idle = false;

    CMsgClientChangeStatus.create = function create(properties) {
        return new CMsgClientChangeStatus(properties);
    };

    CMsgClientChangeStatus.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.persona_state != null && Object.hasOwnProperty.call(message, "persona_state"))
            writer.uint32(8).uint32(message.persona_state);
        if (message.player_name != null && Object.hasOwnProperty.call(message, "player_name"))
            writer.uint32(18).string(message.player_name);
        if (message.is_auto_generated_name != null && Object.hasOwnProperty.call(message, "is_auto_generated_name"))
            writer.uint32(24).bool(message.is_auto_generated_name);
        if (message.high_priority != null && Object.hasOwnProperty.call(message, "high_priority"))
            writer.uint32(32).bool(message.high_priority);
        if (message.persona_set_by_user != null && Object.hasOwnProperty.call(message, "persona_set_by_user"))
            writer.uint32(40).bool(message.persona_set_by_user);
        if (message.persona_state_flags != null && Object.hasOwnProperty.call(message, "persona_state_flags"))
            writer.uint32(48).uint32(message.persona_state_flags);
        if (message.need_persona_response != null && Object.hasOwnProperty.call(message, "need_persona_response"))
            writer.uint32(56).bool(message.need_persona_response);
        if (message.is_client_idle != null && Object.hasOwnProperty.call(message, "is_client_idle"))
            writer.uint32(64).bool(message.is_client_idle);
        return writer;
    };

    CMsgClientChangeStatus.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientChangeStatus();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.persona_state = reader.uint32();
                    break;
                }
            case 2: {
                    message.player_name = reader.string();
                    break;
                }
            case 3: {
                    message.is_auto_generated_name = reader.bool();
                    break;
                }
            case 4: {
                    message.high_priority = reader.bool();
                    break;
                }
            case 5: {
                    message.persona_set_by_user = reader.bool();
                    break;
                }
            case 6: {
                    message.persona_state_flags = reader.uint32();
                    break;
                }
            case 7: {
                    message.need_persona_response = reader.bool();
                    break;
                }
            case 8: {
                    message.is_client_idle = reader.bool();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientChangeStatus.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientChangeStatus)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientChangeStatus: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientChangeStatus();
        if (object.persona_state != null)
            message.persona_state = object.persona_state >>> 0;
        if (object.player_name != null)
            message.player_name = String(object.player_name);
        if (object.is_auto_generated_name != null)
            message.is_auto_generated_name = Boolean(object.is_auto_generated_name);
        if (object.high_priority != null)
            message.high_priority = Boolean(object.high_priority);
        if (object.persona_set_by_user != null)
            message.persona_set_by_user = Boolean(object.persona_set_by_user);
        if (object.persona_state_flags != null)
            message.persona_state_flags = object.persona_state_flags >>> 0;
        if (object.need_persona_response != null)
            message.need_persona_response = Boolean(object.need_persona_response);
        if (object.is_client_idle != null)
            message.is_client_idle = Boolean(object.is_client_idle);
        return message;
    };

    CMsgClientChangeStatus.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.persona_state = 0;
            object.player_name = "";
            object.is_auto_generated_name = false;
            object.high_priority = false;
            object.persona_set_by_user = false;
            object.persona_state_flags = 0;
            object.need_persona_response = false;
            object.is_client_idle = false;
        }
        if (message.persona_state != null && Object.hasOwnProperty.call(message, "persona_state"))
            object.persona_state = message.persona_state;
        if (message.player_name != null && Object.hasOwnProperty.call(message, "player_name"))
            object.player_name = message.player_name;
        if (message.is_auto_generated_name != null && Object.hasOwnProperty.call(message, "is_auto_generated_name"))
            object.is_auto_generated_name = message.is_auto_generated_name;
        if (message.high_priority != null && Object.hasOwnProperty.call(message, "high_priority"))
            object.high_priority = message.high_priority;
        if (message.persona_set_by_user != null && Object.hasOwnProperty.call(message, "persona_set_by_user"))
            object.persona_set_by_user = message.persona_set_by_user;
        if (message.persona_state_flags != null && Object.hasOwnProperty.call(message, "persona_state_flags"))
            object.persona_state_flags = message.persona_state_flags;
        if (message.need_persona_response != null && Object.hasOwnProperty.call(message, "need_persona_response"))
            object.need_persona_response = message.need_persona_response;
        if (message.is_client_idle != null && Object.hasOwnProperty.call(message, "is_client_idle"))
            object.is_client_idle = message.is_client_idle;
        return object;
    };

    CMsgClientChangeStatus.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientChangeStatus.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientChangeStatus";
    };

    return CMsgClientChangeStatus;
})();

export const CMsgClientPlayingSessionState = $root.CMsgClientPlayingSessionState = (() => {

    function CMsgClientPlayingSessionState(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientPlayingSessionState.prototype.playing_blocked = false;
    CMsgClientPlayingSessionState.prototype.playing_app = 0;

    CMsgClientPlayingSessionState.create = function create(properties) {
        return new CMsgClientPlayingSessionState(properties);
    };

    CMsgClientPlayingSessionState.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.playing_blocked != null && Object.hasOwnProperty.call(message, "playing_blocked"))
            writer.uint32(16).bool(message.playing_blocked);
        if (message.playing_app != null && Object.hasOwnProperty.call(message, "playing_app"))
            writer.uint32(24).uint32(message.playing_app);
        return writer;
    };

    CMsgClientPlayingSessionState.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientPlayingSessionState();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 2: {
                    message.playing_blocked = reader.bool();
                    break;
                }
            case 3: {
                    message.playing_app = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientPlayingSessionState.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientPlayingSessionState)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientPlayingSessionState: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientPlayingSessionState();
        if (object.playing_blocked != null)
            message.playing_blocked = Boolean(object.playing_blocked);
        if (object.playing_app != null)
            message.playing_app = object.playing_app >>> 0;
        return message;
    };

    CMsgClientPlayingSessionState.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.playing_blocked = false;
            object.playing_app = 0;
        }
        if (message.playing_blocked != null && Object.hasOwnProperty.call(message, "playing_blocked"))
            object.playing_blocked = message.playing_blocked;
        if (message.playing_app != null && Object.hasOwnProperty.call(message, "playing_app"))
            object.playing_app = message.playing_app;
        return object;
    };

    CMsgClientPlayingSessionState.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientPlayingSessionState.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientPlayingSessionState";
    };

    return CMsgClientPlayingSessionState;
})();

export const CMsgClientKickPlayingSession = $root.CMsgClientKickPlayingSession = (() => {

    function CMsgClientKickPlayingSession(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientKickPlayingSession.prototype.only_stop_game = false;

    CMsgClientKickPlayingSession.create = function create(properties) {
        return new CMsgClientKickPlayingSession(properties);
    };

    CMsgClientKickPlayingSession.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.only_stop_game != null && Object.hasOwnProperty.call(message, "only_stop_game"))
            writer.uint32(8).bool(message.only_stop_game);
        return writer;
    };

    CMsgClientKickPlayingSession.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientKickPlayingSession();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.only_stop_game = reader.bool();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientKickPlayingSession.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientKickPlayingSession)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientKickPlayingSession: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientKickPlayingSession();
        if (object.only_stop_game != null)
            message.only_stop_game = Boolean(object.only_stop_game);
        return message;
    };

    CMsgClientKickPlayingSession.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults)
            object.only_stop_game = false;
        if (message.only_stop_game != null && Object.hasOwnProperty.call(message, "only_stop_game"))
            object.only_stop_game = message.only_stop_game;
        return object;
    };

    CMsgClientKickPlayingSession.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientKickPlayingSession.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientKickPlayingSession";
    };

    return CMsgClientKickPlayingSession;
})();

export const CMsgGCClient = $root.CMsgGCClient = (() => {

    function CMsgGCClient(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgGCClient.prototype.appid = 0;
    CMsgGCClient.prototype.msgtype = 0;
    CMsgGCClient.prototype.payload = $util.newBuffer([]);
    CMsgGCClient.prototype.steamid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgGCClient.prototype.gcname = "";
    CMsgGCClient.prototype.ip = 0;

    CMsgGCClient.create = function create(properties) {
        return new CMsgGCClient(properties);
    };

    CMsgGCClient.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.appid != null && Object.hasOwnProperty.call(message, "appid"))
            writer.uint32(8).uint32(message.appid);
        if (message.msgtype != null && Object.hasOwnProperty.call(message, "msgtype"))
            writer.uint32(16).uint32(message.msgtype);
        if (message.payload != null && Object.hasOwnProperty.call(message, "payload"))
            writer.uint32(26).bytes(message.payload);
        if (message.steamid != null && Object.hasOwnProperty.call(message, "steamid"))
            writer.uint32(33).fixed64(message.steamid);
        if (message.gcname != null && Object.hasOwnProperty.call(message, "gcname"))
            writer.uint32(42).string(message.gcname);
        if (message.ip != null && Object.hasOwnProperty.call(message, "ip"))
            writer.uint32(48).uint32(message.ip);
        return writer;
    };

    CMsgGCClient.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgGCClient();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.appid = reader.uint32();
                    break;
                }
            case 2: {
                    message.msgtype = reader.uint32();
                    break;
                }
            case 3: {
                    message.payload = reader.bytes();
                    break;
                }
            case 4: {
                    message.steamid = reader.fixed64();
                    break;
                }
            case 5: {
                    message.gcname = reader.string();
                    break;
                }
            case 6: {
                    message.ip = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgGCClient.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgGCClient)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgGCClient: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgGCClient();
        if (object.appid != null)
            message.appid = object.appid >>> 0;
        if (object.msgtype != null)
            message.msgtype = object.msgtype >>> 0;
        if (object.payload != null)
            if (typeof object.payload === "string")
                $util.base64.decode(object.payload, message.payload = $util.newBuffer($util.base64.length(object.payload)), 0);
            else if (object.payload.length >= 0)
                message.payload = object.payload;
        if (object.steamid != null)
            if ($util.Long)
                message.steamid = $util.Long.fromValue(object.steamid, true);
            else if (typeof object.steamid === "string")
                message.steamid = parseInt(object.steamid, 10);
            else if (typeof object.steamid === "number")
                message.steamid = object.steamid;
            else if (typeof object.steamid === "object")
                message.steamid = new $util.LongBits(object.steamid.low >>> 0, object.steamid.high >>> 0).toNumber(true);
        if (object.gcname != null)
            message.gcname = String(object.gcname);
        if (object.ip != null)
            message.ip = object.ip >>> 0;
        return message;
    };

    CMsgGCClient.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.appid = 0;
            object.msgtype = 0;
            if (options.bytes === String)
                object.payload = "";
            else {
                object.payload = [];
                if (options.bytes !== Array)
                    object.payload = $util.newBuffer(object.payload);
            }
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.steamid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.steamid = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.gcname = "";
            object.ip = 0;
        }
        if (message.appid != null && Object.hasOwnProperty.call(message, "appid"))
            object.appid = message.appid;
        if (message.msgtype != null && Object.hasOwnProperty.call(message, "msgtype"))
            object.msgtype = message.msgtype;
        if (message.payload != null && Object.hasOwnProperty.call(message, "payload"))
            object.payload = options.bytes === String ? $util.base64.encode(message.payload, 0, message.payload.length) : options.bytes === Array ? Array.prototype.slice.call(message.payload) : message.payload;
        if (message.steamid != null && Object.hasOwnProperty.call(message, "steamid"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.steamid = typeof message.steamid === "number" ? BigInt(message.steamid) : $util.Long.fromBits(message.steamid.low >>> 0, message.steamid.high >>> 0, true).toBigInt();
            else if (typeof message.steamid === "number")
                object.steamid = options.longs === String ? String(message.steamid) : message.steamid;
            else
                object.steamid = options.longs === String ? $util.Long.prototype.toString.call(message.steamid) : options.longs === Number ? new $util.LongBits(message.steamid.low >>> 0, message.steamid.high >>> 0).toNumber(true) : message.steamid;
        if (message.gcname != null && Object.hasOwnProperty.call(message, "gcname"))
            object.gcname = message.gcname;
        if (message.ip != null && Object.hasOwnProperty.call(message, "ip"))
            object.ip = message.ip;
        return object;
    };

    CMsgGCClient.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgGCClient.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgGCClient";
    };

    return CMsgGCClient;
})();

export const CMsgClientHello = $root.CMsgClientHello = (() => {

    function CMsgClientHello(properties) {
        this.socache_have_versions = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientHello.prototype.version = 0;
    CMsgClientHello.prototype.socache_have_versions = $util.emptyArray;
    CMsgClientHello.prototype.client_session_need = 0;
    CMsgClientHello.prototype.client_launcher = 0;
    CMsgClientHello.prototype.partner_srcid = 0;
    CMsgClientHello.prototype.partner_accountid = 0;
    CMsgClientHello.prototype.partner_accountflags = 0;
    CMsgClientHello.prototype.partner_accountbalance = 0;
    CMsgClientHello.prototype.steam_launcher = 0;

    CMsgClientHello.create = function create(properties) {
        return new CMsgClientHello(properties);
    };

    CMsgClientHello.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            writer.uint32(8).uint32(message.version);
        if (message.socache_have_versions != null && message.socache_have_versions.length)
            for (let i = 0; i < message.socache_have_versions.length; ++i)
                $root.CMsgSOCacheHaveVersion.encode(message.socache_have_versions[i], writer.uint32(18).fork(), q + 1).ldelim();
        if (message.client_session_need != null && Object.hasOwnProperty.call(message, "client_session_need"))
            writer.uint32(24).uint32(message.client_session_need);
        if (message.client_launcher != null && Object.hasOwnProperty.call(message, "client_launcher"))
            writer.uint32(32).uint32(message.client_launcher);
        if (message.partner_srcid != null && Object.hasOwnProperty.call(message, "partner_srcid"))
            writer.uint32(40).uint32(message.partner_srcid);
        if (message.partner_accountid != null && Object.hasOwnProperty.call(message, "partner_accountid"))
            writer.uint32(48).uint32(message.partner_accountid);
        if (message.partner_accountflags != null && Object.hasOwnProperty.call(message, "partner_accountflags"))
            writer.uint32(56).uint32(message.partner_accountflags);
        if (message.partner_accountbalance != null && Object.hasOwnProperty.call(message, "partner_accountbalance"))
            writer.uint32(64).uint32(message.partner_accountbalance);
        if (message.steam_launcher != null && Object.hasOwnProperty.call(message, "steam_launcher"))
            writer.uint32(72).uint32(message.steam_launcher);
        return writer;
    };

    CMsgClientHello.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientHello();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.version = reader.uint32();
                    break;
                }
            case 2: {
                    if (!(message.socache_have_versions && message.socache_have_versions.length))
                        message.socache_have_versions = [];
                    message.socache_have_versions.push($root.CMsgSOCacheHaveVersion.decode(reader, reader.uint32(), undefined, long + 1));
                    break;
                }
            case 3: {
                    message.client_session_need = reader.uint32();
                    break;
                }
            case 4: {
                    message.client_launcher = reader.uint32();
                    break;
                }
            case 5: {
                    message.partner_srcid = reader.uint32();
                    break;
                }
            case 6: {
                    message.partner_accountid = reader.uint32();
                    break;
                }
            case 7: {
                    message.partner_accountflags = reader.uint32();
                    break;
                }
            case 8: {
                    message.partner_accountbalance = reader.uint32();
                    break;
                }
            case 9: {
                    message.steam_launcher = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientHello.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientHello)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientHello: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientHello();
        if (object.version != null)
            message.version = object.version >>> 0;
        if (object.socache_have_versions) {
            if (!Array.isArray(object.socache_have_versions))
                throw TypeError(".CMsgClientHello.socache_have_versions: array expected");
            message.socache_have_versions = [];
            for (let i = 0; i < object.socache_have_versions.length; ++i) {
                if (!$util.isObject(object.socache_have_versions[i]))
                    throw TypeError(".CMsgClientHello.socache_have_versions: object expected");
                message.socache_have_versions[i] = $root.CMsgSOCacheHaveVersion.fromObject(object.socache_have_versions[i], long + 1);
            }
        }
        if (object.client_session_need != null)
            message.client_session_need = object.client_session_need >>> 0;
        if (object.client_launcher != null)
            message.client_launcher = object.client_launcher >>> 0;
        if (object.partner_srcid != null)
            message.partner_srcid = object.partner_srcid >>> 0;
        if (object.partner_accountid != null)
            message.partner_accountid = object.partner_accountid >>> 0;
        if (object.partner_accountflags != null)
            message.partner_accountflags = object.partner_accountflags >>> 0;
        if (object.partner_accountbalance != null)
            message.partner_accountbalance = object.partner_accountbalance >>> 0;
        if (object.steam_launcher != null)
            message.steam_launcher = object.steam_launcher >>> 0;
        return message;
    };

    CMsgClientHello.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.arrays || options.defaults)
            object.socache_have_versions = [];
        if (options.defaults) {
            object.version = 0;
            object.client_session_need = 0;
            object.client_launcher = 0;
            object.partner_srcid = 0;
            object.partner_accountid = 0;
            object.partner_accountflags = 0;
            object.partner_accountbalance = 0;
            object.steam_launcher = 0;
        }
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            object.version = message.version;
        if (message.socache_have_versions && message.socache_have_versions.length) {
            object.socache_have_versions = [];
            for (let j = 0; j < message.socache_have_versions.length; ++j)
                object.socache_have_versions[j] = $root.CMsgSOCacheHaveVersion.toObject(message.socache_have_versions[j], options, q + 1);
        }
        if (message.client_session_need != null && Object.hasOwnProperty.call(message, "client_session_need"))
            object.client_session_need = message.client_session_need;
        if (message.client_launcher != null && Object.hasOwnProperty.call(message, "client_launcher"))
            object.client_launcher = message.client_launcher;
        if (message.partner_srcid != null && Object.hasOwnProperty.call(message, "partner_srcid"))
            object.partner_srcid = message.partner_srcid;
        if (message.partner_accountid != null && Object.hasOwnProperty.call(message, "partner_accountid"))
            object.partner_accountid = message.partner_accountid;
        if (message.partner_accountflags != null && Object.hasOwnProperty.call(message, "partner_accountflags"))
            object.partner_accountflags = message.partner_accountflags;
        if (message.partner_accountbalance != null && Object.hasOwnProperty.call(message, "partner_accountbalance"))
            object.partner_accountbalance = message.partner_accountbalance;
        if (message.steam_launcher != null && Object.hasOwnProperty.call(message, "steam_launcher"))
            object.steam_launcher = message.steam_launcher;
        return object;
    };

    CMsgClientHello.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientHello.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientHello";
    };

    return CMsgClientHello;
})();

export const CMsgSOCacheHaveVersion = $root.CMsgSOCacheHaveVersion = (() => {

    function CMsgSOCacheHaveVersion(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgSOCacheHaveVersion.prototype.soid = null;
    CMsgSOCacheHaveVersion.prototype.version = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    CMsgSOCacheHaveVersion.create = function create(properties) {
        return new CMsgSOCacheHaveVersion(properties);
    };

    CMsgSOCacheHaveVersion.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.soid != null && Object.hasOwnProperty.call(message, "soid"))
            $root.CMsgSOIDOwner.encode(message.soid, writer.uint32(10).fork(), q + 1).ldelim();
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            writer.uint32(17).fixed64(message.version);
        return writer;
    };

    CMsgSOCacheHaveVersion.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgSOCacheHaveVersion();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.soid = $root.CMsgSOIDOwner.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            case 2: {
                    message.version = reader.fixed64();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgSOCacheHaveVersion.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgSOCacheHaveVersion)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgSOCacheHaveVersion: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgSOCacheHaveVersion();
        if (object.soid != null) {
            if (!$util.isObject(object.soid))
                throw TypeError(".CMsgSOCacheHaveVersion.soid: object expected");
            message.soid = $root.CMsgSOIDOwner.fromObject(object.soid, long + 1);
        }
        if (object.version != null)
            if ($util.Long)
                message.version = $util.Long.fromValue(object.version, true);
            else if (typeof object.version === "string")
                message.version = parseInt(object.version, 10);
            else if (typeof object.version === "number")
                message.version = object.version;
            else if (typeof object.version === "object")
                message.version = new $util.LongBits(object.version.low >>> 0, object.version.high >>> 0).toNumber(true);
        return message;
    };

    CMsgSOCacheHaveVersion.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.soid = null;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.version = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.version = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
        }
        if (message.soid != null && Object.hasOwnProperty.call(message, "soid"))
            object.soid = $root.CMsgSOIDOwner.toObject(message.soid, options, q + 1);
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.version = typeof message.version === "number" ? BigInt(message.version) : $util.Long.fromBits(message.version.low >>> 0, message.version.high >>> 0, true).toBigInt();
            else if (typeof message.version === "number")
                object.version = options.longs === String ? String(message.version) : message.version;
            else
                object.version = options.longs === String ? $util.Long.prototype.toString.call(message.version) : options.longs === Number ? new $util.LongBits(message.version.low >>> 0, message.version.high >>> 0).toNumber(true) : message.version;
        return object;
    };

    CMsgSOCacheHaveVersion.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgSOCacheHaveVersion.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgSOCacheHaveVersion";
    };

    return CMsgSOCacheHaveVersion;
})();

export const CMsgSOIDOwner = $root.CMsgSOIDOwner = (() => {

    function CMsgSOIDOwner(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgSOIDOwner.prototype.type = 0;
    CMsgSOIDOwner.prototype.id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    CMsgSOIDOwner.create = function create(properties) {
        return new CMsgSOIDOwner(properties);
    };

    CMsgSOIDOwner.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            writer.uint32(8).uint32(message.type);
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(16).uint64(message.id);
        return writer;
    };

    CMsgSOIDOwner.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgSOIDOwner();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.type = reader.uint32();
                    break;
                }
            case 2: {
                    message.id = reader.uint64();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgSOIDOwner.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgSOIDOwner)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgSOIDOwner: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgSOIDOwner();
        if (object.type != null)
            message.type = object.type >>> 0;
        if (object.id != null)
            if ($util.Long)
                message.id = $util.Long.fromValue(object.id, true);
            else if (typeof object.id === "string")
                message.id = parseInt(object.id, 10);
            else if (typeof object.id === "number")
                message.id = object.id;
            else if (typeof object.id === "object")
                message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber(true);
        return message;
    };

    CMsgSOIDOwner.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.type = 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
        }
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            object.type = message.type;
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.id = typeof message.id === "number" ? BigInt(message.id) : $util.Long.fromBits(message.id.low >>> 0, message.id.high >>> 0, true).toBigInt();
            else if (typeof message.id === "number")
                object.id = options.longs === String ? String(message.id) : message.id;
            else
                object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber(true) : message.id;
        return object;
    };

    CMsgSOIDOwner.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgSOIDOwner.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgSOIDOwner";
    };

    return CMsgSOIDOwner;
})();

export const CMsgClientWelcome = $root.CMsgClientWelcome = (() => {

    function CMsgClientWelcome(properties) {
        this.outofdate_subscribed_caches = [];
        this.uptodate_subscribed_caches = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgClientWelcome.prototype.version = 0;
    CMsgClientWelcome.prototype.game_data = $util.newBuffer([]);
    CMsgClientWelcome.prototype.outofdate_subscribed_caches = $util.emptyArray;
    CMsgClientWelcome.prototype.uptodate_subscribed_caches = $util.emptyArray;
    CMsgClientWelcome.prototype.location = null;
    CMsgClientWelcome.prototype.game_data2 = $util.newBuffer([]);
    CMsgClientWelcome.prototype.rtime32_gc_welcome_timestamp = 0;
    CMsgClientWelcome.prototype.currency = 0;
    CMsgClientWelcome.prototype.balance = 0;
    CMsgClientWelcome.prototype.balance_url = "";
    CMsgClientWelcome.prototype.txn_country_code = "";

    CMsgClientWelcome.create = function create(properties) {
        return new CMsgClientWelcome(properties);
    };

    CMsgClientWelcome.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            writer.uint32(8).uint32(message.version);
        if (message.game_data != null && Object.hasOwnProperty.call(message, "game_data"))
            writer.uint32(18).bytes(message.game_data);
        if (message.outofdate_subscribed_caches != null && message.outofdate_subscribed_caches.length)
            for (let i = 0; i < message.outofdate_subscribed_caches.length; ++i)
                $root.CMsgSOCacheSubscribed.encode(message.outofdate_subscribed_caches[i], writer.uint32(26).fork(), q + 1).ldelim();
        if (message.uptodate_subscribed_caches != null && message.uptodate_subscribed_caches.length)
            for (let i = 0; i < message.uptodate_subscribed_caches.length; ++i)
                $root.CMsgSOCacheSubscriptionCheck.encode(message.uptodate_subscribed_caches[i], writer.uint32(34).fork(), q + 1).ldelim();
        if (message.location != null && Object.hasOwnProperty.call(message, "location"))
            $root.CMsgClientWelcome.Location.encode(message.location, writer.uint32(42).fork(), q + 1).ldelim();
        if (message.game_data2 != null && Object.hasOwnProperty.call(message, "game_data2"))
            writer.uint32(50).bytes(message.game_data2);
        if (message.rtime32_gc_welcome_timestamp != null && Object.hasOwnProperty.call(message, "rtime32_gc_welcome_timestamp"))
            writer.uint32(56).uint32(message.rtime32_gc_welcome_timestamp);
        if (message.currency != null && Object.hasOwnProperty.call(message, "currency"))
            writer.uint32(64).uint32(message.currency);
        if (message.balance != null && Object.hasOwnProperty.call(message, "balance"))
            writer.uint32(72).uint32(message.balance);
        if (message.balance_url != null && Object.hasOwnProperty.call(message, "balance_url"))
            writer.uint32(82).string(message.balance_url);
        if (message.txn_country_code != null && Object.hasOwnProperty.call(message, "txn_country_code"))
            writer.uint32(90).string(message.txn_country_code);
        return writer;
    };

    CMsgClientWelcome.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgClientWelcome();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.version = reader.uint32();
                    break;
                }
            case 2: {
                    message.game_data = reader.bytes();
                    break;
                }
            case 3: {
                    if (!(message.outofdate_subscribed_caches && message.outofdate_subscribed_caches.length))
                        message.outofdate_subscribed_caches = [];
                    message.outofdate_subscribed_caches.push($root.CMsgSOCacheSubscribed.decode(reader, reader.uint32(), undefined, long + 1));
                    break;
                }
            case 4: {
                    if (!(message.uptodate_subscribed_caches && message.uptodate_subscribed_caches.length))
                        message.uptodate_subscribed_caches = [];
                    message.uptodate_subscribed_caches.push($root.CMsgSOCacheSubscriptionCheck.decode(reader, reader.uint32(), undefined, long + 1));
                    break;
                }
            case 5: {
                    message.location = $root.CMsgClientWelcome.Location.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            case 6: {
                    message.game_data2 = reader.bytes();
                    break;
                }
            case 7: {
                    message.rtime32_gc_welcome_timestamp = reader.uint32();
                    break;
                }
            case 8: {
                    message.currency = reader.uint32();
                    break;
                }
            case 9: {
                    message.balance = reader.uint32();
                    break;
                }
            case 10: {
                    message.balance_url = reader.string();
                    break;
                }
            case 11: {
                    message.txn_country_code = reader.string();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgClientWelcome.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgClientWelcome)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgClientWelcome: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgClientWelcome();
        if (object.version != null)
            message.version = object.version >>> 0;
        if (object.game_data != null)
            if (typeof object.game_data === "string")
                $util.base64.decode(object.game_data, message.game_data = $util.newBuffer($util.base64.length(object.game_data)), 0);
            else if (object.game_data.length >= 0)
                message.game_data = object.game_data;
        if (object.outofdate_subscribed_caches) {
            if (!Array.isArray(object.outofdate_subscribed_caches))
                throw TypeError(".CMsgClientWelcome.outofdate_subscribed_caches: array expected");
            message.outofdate_subscribed_caches = [];
            for (let i = 0; i < object.outofdate_subscribed_caches.length; ++i) {
                if (!$util.isObject(object.outofdate_subscribed_caches[i]))
                    throw TypeError(".CMsgClientWelcome.outofdate_subscribed_caches: object expected");
                message.outofdate_subscribed_caches[i] = $root.CMsgSOCacheSubscribed.fromObject(object.outofdate_subscribed_caches[i], long + 1);
            }
        }
        if (object.uptodate_subscribed_caches) {
            if (!Array.isArray(object.uptodate_subscribed_caches))
                throw TypeError(".CMsgClientWelcome.uptodate_subscribed_caches: array expected");
            message.uptodate_subscribed_caches = [];
            for (let i = 0; i < object.uptodate_subscribed_caches.length; ++i) {
                if (!$util.isObject(object.uptodate_subscribed_caches[i]))
                    throw TypeError(".CMsgClientWelcome.uptodate_subscribed_caches: object expected");
                message.uptodate_subscribed_caches[i] = $root.CMsgSOCacheSubscriptionCheck.fromObject(object.uptodate_subscribed_caches[i], long + 1);
            }
        }
        if (object.location != null) {
            if (!$util.isObject(object.location))
                throw TypeError(".CMsgClientWelcome.location: object expected");
            message.location = $root.CMsgClientWelcome.Location.fromObject(object.location, long + 1);
        }
        if (object.game_data2 != null)
            if (typeof object.game_data2 === "string")
                $util.base64.decode(object.game_data2, message.game_data2 = $util.newBuffer($util.base64.length(object.game_data2)), 0);
            else if (object.game_data2.length >= 0)
                message.game_data2 = object.game_data2;
        if (object.rtime32_gc_welcome_timestamp != null)
            message.rtime32_gc_welcome_timestamp = object.rtime32_gc_welcome_timestamp >>> 0;
        if (object.currency != null)
            message.currency = object.currency >>> 0;
        if (object.balance != null)
            message.balance = object.balance >>> 0;
        if (object.balance_url != null)
            message.balance_url = String(object.balance_url);
        if (object.txn_country_code != null)
            message.txn_country_code = String(object.txn_country_code);
        return message;
    };

    CMsgClientWelcome.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.arrays || options.defaults) {
            object.outofdate_subscribed_caches = [];
            object.uptodate_subscribed_caches = [];
        }
        if (options.defaults) {
            object.version = 0;
            if (options.bytes === String)
                object.game_data = "";
            else {
                object.game_data = [];
                if (options.bytes !== Array)
                    object.game_data = $util.newBuffer(object.game_data);
            }
            object.location = null;
            if (options.bytes === String)
                object.game_data2 = "";
            else {
                object.game_data2 = [];
                if (options.bytes !== Array)
                    object.game_data2 = $util.newBuffer(object.game_data2);
            }
            object.rtime32_gc_welcome_timestamp = 0;
            object.currency = 0;
            object.balance = 0;
            object.balance_url = "";
            object.txn_country_code = "";
        }
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            object.version = message.version;
        if (message.game_data != null && Object.hasOwnProperty.call(message, "game_data"))
            object.game_data = options.bytes === String ? $util.base64.encode(message.game_data, 0, message.game_data.length) : options.bytes === Array ? Array.prototype.slice.call(message.game_data) : message.game_data;
        if (message.outofdate_subscribed_caches && message.outofdate_subscribed_caches.length) {
            object.outofdate_subscribed_caches = [];
            for (let j = 0; j < message.outofdate_subscribed_caches.length; ++j)
                object.outofdate_subscribed_caches[j] = $root.CMsgSOCacheSubscribed.toObject(message.outofdate_subscribed_caches[j], options, q + 1);
        }
        if (message.uptodate_subscribed_caches && message.uptodate_subscribed_caches.length) {
            object.uptodate_subscribed_caches = [];
            for (let j = 0; j < message.uptodate_subscribed_caches.length; ++j)
                object.uptodate_subscribed_caches[j] = $root.CMsgSOCacheSubscriptionCheck.toObject(message.uptodate_subscribed_caches[j], options, q + 1);
        }
        if (message.location != null && Object.hasOwnProperty.call(message, "location"))
            object.location = $root.CMsgClientWelcome.Location.toObject(message.location, options, q + 1);
        if (message.game_data2 != null && Object.hasOwnProperty.call(message, "game_data2"))
            object.game_data2 = options.bytes === String ? $util.base64.encode(message.game_data2, 0, message.game_data2.length) : options.bytes === Array ? Array.prototype.slice.call(message.game_data2) : message.game_data2;
        if (message.rtime32_gc_welcome_timestamp != null && Object.hasOwnProperty.call(message, "rtime32_gc_welcome_timestamp"))
            object.rtime32_gc_welcome_timestamp = message.rtime32_gc_welcome_timestamp;
        if (message.currency != null && Object.hasOwnProperty.call(message, "currency"))
            object.currency = message.currency;
        if (message.balance != null && Object.hasOwnProperty.call(message, "balance"))
            object.balance = message.balance;
        if (message.balance_url != null && Object.hasOwnProperty.call(message, "balance_url"))
            object.balance_url = message.balance_url;
        if (message.txn_country_code != null && Object.hasOwnProperty.call(message, "txn_country_code"))
            object.txn_country_code = message.txn_country_code;
        return object;
    };

    CMsgClientWelcome.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgClientWelcome.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgClientWelcome";
    };

    CMsgClientWelcome.Location = (function() {

        function Location(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        Location.prototype.latitude = 0;
        Location.prototype.longitude = 0;
        Location.prototype.country = "";

        Location.create = function create(properties) {
            return new Location(properties);
        };

        Location.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.latitude != null && Object.hasOwnProperty.call(message, "latitude"))
                writer.uint32(13).float(message.latitude);
            if (message.longitude != null && Object.hasOwnProperty.call(message, "longitude"))
                writer.uint32(21).float(message.longitude);
            if (message.country != null && Object.hasOwnProperty.call(message, "country"))
                writer.uint32(26).string(message.country);
            return writer;
        };

        Location.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.CMsgClientWelcome.Location();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.latitude = reader.float();
                        break;
                    }
                case 2: {
                        message.longitude = reader.float();
                        break;
                    }
                case 3: {
                        message.country = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        Location.fromObject = function fromObject(object, long) {
            if (object instanceof $root.CMsgClientWelcome.Location)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".CMsgClientWelcome.Location: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.CMsgClientWelcome.Location();
            if (object.latitude != null)
                message.latitude = Number(object.latitude);
            if (object.longitude != null)
                message.longitude = Number(object.longitude);
            if (object.country != null)
                message.country = String(object.country);
            return message;
        };

        Location.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.latitude = 0;
                object.longitude = 0;
                object.country = "";
            }
            if (message.latitude != null && Object.hasOwnProperty.call(message, "latitude"))
                object.latitude = options.json && !isFinite(message.latitude) ? String(message.latitude) : message.latitude;
            if (message.longitude != null && Object.hasOwnProperty.call(message, "longitude"))
                object.longitude = options.json && !isFinite(message.longitude) ? String(message.longitude) : message.longitude;
            if (message.country != null && Object.hasOwnProperty.call(message, "country"))
                object.country = message.country;
            return object;
        };

        Location.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        Location.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/CMsgClientWelcome.Location";
        };

        return Location;
    })();

    return CMsgClientWelcome;
})();

export const CMsgSOCacheSubscribed = $root.CMsgSOCacheSubscribed = (() => {

    function CMsgSOCacheSubscribed(properties) {
        this.objects = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgSOCacheSubscribed.prototype.objects = $util.emptyArray;
    CMsgSOCacheSubscribed.prototype.version = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgSOCacheSubscribed.prototype.owner_soid = null;

    CMsgSOCacheSubscribed.create = function create(properties) {
        return new CMsgSOCacheSubscribed(properties);
    };

    CMsgSOCacheSubscribed.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.objects != null && message.objects.length)
            for (let i = 0; i < message.objects.length; ++i)
                $root.CMsgSOCacheSubscribed.SubscribedType.encode(message.objects[i], writer.uint32(18).fork(), q + 1).ldelim();
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            writer.uint32(25).fixed64(message.version);
        if (message.owner_soid != null && Object.hasOwnProperty.call(message, "owner_soid"))
            $root.CMsgSOIDOwner.encode(message.owner_soid, writer.uint32(34).fork(), q + 1).ldelim();
        return writer;
    };

    CMsgSOCacheSubscribed.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgSOCacheSubscribed();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 2: {
                    if (!(message.objects && message.objects.length))
                        message.objects = [];
                    message.objects.push($root.CMsgSOCacheSubscribed.SubscribedType.decode(reader, reader.uint32(), undefined, long + 1));
                    break;
                }
            case 3: {
                    message.version = reader.fixed64();
                    break;
                }
            case 4: {
                    message.owner_soid = $root.CMsgSOIDOwner.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgSOCacheSubscribed.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgSOCacheSubscribed)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgSOCacheSubscribed: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgSOCacheSubscribed();
        if (object.objects) {
            if (!Array.isArray(object.objects))
                throw TypeError(".CMsgSOCacheSubscribed.objects: array expected");
            message.objects = [];
            for (let i = 0; i < object.objects.length; ++i) {
                if (!$util.isObject(object.objects[i]))
                    throw TypeError(".CMsgSOCacheSubscribed.objects: object expected");
                message.objects[i] = $root.CMsgSOCacheSubscribed.SubscribedType.fromObject(object.objects[i], long + 1);
            }
        }
        if (object.version != null)
            if ($util.Long)
                message.version = $util.Long.fromValue(object.version, true);
            else if (typeof object.version === "string")
                message.version = parseInt(object.version, 10);
            else if (typeof object.version === "number")
                message.version = object.version;
            else if (typeof object.version === "object")
                message.version = new $util.LongBits(object.version.low >>> 0, object.version.high >>> 0).toNumber(true);
        if (object.owner_soid != null) {
            if (!$util.isObject(object.owner_soid))
                throw TypeError(".CMsgSOCacheSubscribed.owner_soid: object expected");
            message.owner_soid = $root.CMsgSOIDOwner.fromObject(object.owner_soid, long + 1);
        }
        return message;
    };

    CMsgSOCacheSubscribed.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.arrays || options.defaults)
            object.objects = [];
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.version = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.version = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.owner_soid = null;
        }
        if (message.objects && message.objects.length) {
            object.objects = [];
            for (let j = 0; j < message.objects.length; ++j)
                object.objects[j] = $root.CMsgSOCacheSubscribed.SubscribedType.toObject(message.objects[j], options, q + 1);
        }
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.version = typeof message.version === "number" ? BigInt(message.version) : $util.Long.fromBits(message.version.low >>> 0, message.version.high >>> 0, true).toBigInt();
            else if (typeof message.version === "number")
                object.version = options.longs === String ? String(message.version) : message.version;
            else
                object.version = options.longs === String ? $util.Long.prototype.toString.call(message.version) : options.longs === Number ? new $util.LongBits(message.version.low >>> 0, message.version.high >>> 0).toNumber(true) : message.version;
        if (message.owner_soid != null && Object.hasOwnProperty.call(message, "owner_soid"))
            object.owner_soid = $root.CMsgSOIDOwner.toObject(message.owner_soid, options, q + 1);
        return object;
    };

    CMsgSOCacheSubscribed.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgSOCacheSubscribed.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgSOCacheSubscribed";
    };

    CMsgSOCacheSubscribed.SubscribedType = (function() {

        function SubscribedType(properties) {
            this.object_data = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        SubscribedType.prototype.type_id = 0;
        SubscribedType.prototype.object_data = $util.emptyArray;

        SubscribedType.create = function create(properties) {
            return new SubscribedType(properties);
        };

        SubscribedType.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.type_id != null && Object.hasOwnProperty.call(message, "type_id"))
                writer.uint32(8).int32(message.type_id);
            if (message.object_data != null && message.object_data.length)
                for (let i = 0; i < message.object_data.length; ++i)
                    writer.uint32(18).bytes(message.object_data[i]);
            return writer;
        };

        SubscribedType.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.CMsgSOCacheSubscribed.SubscribedType();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.type_id = reader.int32();
                        break;
                    }
                case 2: {
                        if (!(message.object_data && message.object_data.length))
                            message.object_data = [];
                        message.object_data.push(reader.bytes());
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        SubscribedType.fromObject = function fromObject(object, long) {
            if (object instanceof $root.CMsgSOCacheSubscribed.SubscribedType)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".CMsgSOCacheSubscribed.SubscribedType: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.CMsgSOCacheSubscribed.SubscribedType();
            if (object.type_id != null)
                message.type_id = object.type_id | 0;
            if (object.object_data) {
                if (!Array.isArray(object.object_data))
                    throw TypeError(".CMsgSOCacheSubscribed.SubscribedType.object_data: array expected");
                message.object_data = [];
                for (let i = 0; i < object.object_data.length; ++i)
                    if (typeof object.object_data[i] === "string")
                        $util.base64.decode(object.object_data[i], message.object_data[i] = $util.newBuffer($util.base64.length(object.object_data[i])), 0);
                    else if (object.object_data[i].length >= 0)
                        message.object_data[i] = object.object_data[i];
            }
            return message;
        };

        SubscribedType.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.arrays || options.defaults)
                object.object_data = [];
            if (options.defaults)
                object.type_id = 0;
            if (message.type_id != null && Object.hasOwnProperty.call(message, "type_id"))
                object.type_id = message.type_id;
            if (message.object_data && message.object_data.length) {
                object.object_data = [];
                for (let j = 0; j < message.object_data.length; ++j)
                    object.object_data[j] = options.bytes === String ? $util.base64.encode(message.object_data[j], 0, message.object_data[j].length) : options.bytes === Array ? Array.prototype.slice.call(message.object_data[j]) : message.object_data[j];
            }
            return object;
        };

        SubscribedType.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        SubscribedType.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/CMsgSOCacheSubscribed.SubscribedType";
        };

        return SubscribedType;
    })();

    return CMsgSOCacheSubscribed;
})();

export const CMsgSOCacheSubscriptionCheck = $root.CMsgSOCacheSubscriptionCheck = (() => {

    function CMsgSOCacheSubscriptionCheck(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgSOCacheSubscriptionCheck.prototype.version = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgSOCacheSubscriptionCheck.prototype.owner_soid = null;

    CMsgSOCacheSubscriptionCheck.create = function create(properties) {
        return new CMsgSOCacheSubscriptionCheck(properties);
    };

    CMsgSOCacheSubscriptionCheck.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            writer.uint32(17).fixed64(message.version);
        if (message.owner_soid != null && Object.hasOwnProperty.call(message, "owner_soid"))
            $root.CMsgSOIDOwner.encode(message.owner_soid, writer.uint32(26).fork(), q + 1).ldelim();
        return writer;
    };

    CMsgSOCacheSubscriptionCheck.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgSOCacheSubscriptionCheck();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 2: {
                    message.version = reader.fixed64();
                    break;
                }
            case 3: {
                    message.owner_soid = $root.CMsgSOIDOwner.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgSOCacheSubscriptionCheck.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgSOCacheSubscriptionCheck)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgSOCacheSubscriptionCheck: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgSOCacheSubscriptionCheck();
        if (object.version != null)
            if ($util.Long)
                message.version = $util.Long.fromValue(object.version, true);
            else if (typeof object.version === "string")
                message.version = parseInt(object.version, 10);
            else if (typeof object.version === "number")
                message.version = object.version;
            else if (typeof object.version === "object")
                message.version = new $util.LongBits(object.version.low >>> 0, object.version.high >>> 0).toNumber(true);
        if (object.owner_soid != null) {
            if (!$util.isObject(object.owner_soid))
                throw TypeError(".CMsgSOCacheSubscriptionCheck.owner_soid: object expected");
            message.owner_soid = $root.CMsgSOIDOwner.fromObject(object.owner_soid, long + 1);
        }
        return message;
    };

    CMsgSOCacheSubscriptionCheck.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.version = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.version = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.owner_soid = null;
        }
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.version = typeof message.version === "number" ? BigInt(message.version) : $util.Long.fromBits(message.version.low >>> 0, message.version.high >>> 0, true).toBigInt();
            else if (typeof message.version === "number")
                object.version = options.longs === String ? String(message.version) : message.version;
            else
                object.version = options.longs === String ? $util.Long.prototype.toString.call(message.version) : options.longs === Number ? new $util.LongBits(message.version.low >>> 0, message.version.high >>> 0).toNumber(true) : message.version;
        if (message.owner_soid != null && Object.hasOwnProperty.call(message, "owner_soid"))
            object.owner_soid = $root.CMsgSOIDOwner.toObject(message.owner_soid, options, q + 1);
        return object;
    };

    CMsgSOCacheSubscriptionCheck.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgSOCacheSubscriptionCheck.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgSOCacheSubscriptionCheck";
    };

    return CMsgSOCacheSubscriptionCheck;
})();

export const CMsgSOSingleObject = $root.CMsgSOSingleObject = (() => {

    function CMsgSOSingleObject(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgSOSingleObject.prototype.type_id = 0;
    CMsgSOSingleObject.prototype.object_data = $util.newBuffer([]);
    CMsgSOSingleObject.prototype.version = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgSOSingleObject.prototype.owner_soid = null;

    CMsgSOSingleObject.create = function create(properties) {
        return new CMsgSOSingleObject(properties);
    };

    CMsgSOSingleObject.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.type_id != null && Object.hasOwnProperty.call(message, "type_id"))
            writer.uint32(16).int32(message.type_id);
        if (message.object_data != null && Object.hasOwnProperty.call(message, "object_data"))
            writer.uint32(26).bytes(message.object_data);
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            writer.uint32(33).fixed64(message.version);
        if (message.owner_soid != null && Object.hasOwnProperty.call(message, "owner_soid"))
            $root.CMsgSOIDOwner.encode(message.owner_soid, writer.uint32(42).fork(), q + 1).ldelim();
        return writer;
    };

    CMsgSOSingleObject.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgSOSingleObject();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 2: {
                    message.type_id = reader.int32();
                    break;
                }
            case 3: {
                    message.object_data = reader.bytes();
                    break;
                }
            case 4: {
                    message.version = reader.fixed64();
                    break;
                }
            case 5: {
                    message.owner_soid = $root.CMsgSOIDOwner.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgSOSingleObject.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgSOSingleObject)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgSOSingleObject: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgSOSingleObject();
        if (object.type_id != null)
            message.type_id = object.type_id | 0;
        if (object.object_data != null)
            if (typeof object.object_data === "string")
                $util.base64.decode(object.object_data, message.object_data = $util.newBuffer($util.base64.length(object.object_data)), 0);
            else if (object.object_data.length >= 0)
                message.object_data = object.object_data;
        if (object.version != null)
            if ($util.Long)
                message.version = $util.Long.fromValue(object.version, true);
            else if (typeof object.version === "string")
                message.version = parseInt(object.version, 10);
            else if (typeof object.version === "number")
                message.version = object.version;
            else if (typeof object.version === "object")
                message.version = new $util.LongBits(object.version.low >>> 0, object.version.high >>> 0).toNumber(true);
        if (object.owner_soid != null) {
            if (!$util.isObject(object.owner_soid))
                throw TypeError(".CMsgSOSingleObject.owner_soid: object expected");
            message.owner_soid = $root.CMsgSOIDOwner.fromObject(object.owner_soid, long + 1);
        }
        return message;
    };

    CMsgSOSingleObject.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.type_id = 0;
            if (options.bytes === String)
                object.object_data = "";
            else {
                object.object_data = [];
                if (options.bytes !== Array)
                    object.object_data = $util.newBuffer(object.object_data);
            }
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.version = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.version = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.owner_soid = null;
        }
        if (message.type_id != null && Object.hasOwnProperty.call(message, "type_id"))
            object.type_id = message.type_id;
        if (message.object_data != null && Object.hasOwnProperty.call(message, "object_data"))
            object.object_data = options.bytes === String ? $util.base64.encode(message.object_data, 0, message.object_data.length) : options.bytes === Array ? Array.prototype.slice.call(message.object_data) : message.object_data;
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.version = typeof message.version === "number" ? BigInt(message.version) : $util.Long.fromBits(message.version.low >>> 0, message.version.high >>> 0, true).toBigInt();
            else if (typeof message.version === "number")
                object.version = options.longs === String ? String(message.version) : message.version;
            else
                object.version = options.longs === String ? $util.Long.prototype.toString.call(message.version) : options.longs === Number ? new $util.LongBits(message.version.low >>> 0, message.version.high >>> 0).toNumber(true) : message.version;
        if (message.owner_soid != null && Object.hasOwnProperty.call(message, "owner_soid"))
            object.owner_soid = $root.CMsgSOIDOwner.toObject(message.owner_soid, options, q + 1);
        return object;
    };

    CMsgSOSingleObject.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgSOSingleObject.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgSOSingleObject";
    };

    return CMsgSOSingleObject;
})();

export const CMsgSOMultipleObjects = $root.CMsgSOMultipleObjects = (() => {

    function CMsgSOMultipleObjects(properties) {
        this.objects_modified = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgSOMultipleObjects.prototype.objects_modified = $util.emptyArray;
    CMsgSOMultipleObjects.prototype.version = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgSOMultipleObjects.prototype.owner_soid = null;

    CMsgSOMultipleObjects.create = function create(properties) {
        return new CMsgSOMultipleObjects(properties);
    };

    CMsgSOMultipleObjects.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.objects_modified != null && message.objects_modified.length)
            for (let i = 0; i < message.objects_modified.length; ++i)
                $root.CMsgSOMultipleObjects.SingleObject.encode(message.objects_modified[i], writer.uint32(18).fork(), q + 1).ldelim();
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            writer.uint32(25).fixed64(message.version);
        if (message.owner_soid != null && Object.hasOwnProperty.call(message, "owner_soid"))
            $root.CMsgSOIDOwner.encode(message.owner_soid, writer.uint32(50).fork(), q + 1).ldelim();
        return writer;
    };

    CMsgSOMultipleObjects.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgSOMultipleObjects();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 2: {
                    if (!(message.objects_modified && message.objects_modified.length))
                        message.objects_modified = [];
                    message.objects_modified.push($root.CMsgSOMultipleObjects.SingleObject.decode(reader, reader.uint32(), undefined, long + 1));
                    break;
                }
            case 3: {
                    message.version = reader.fixed64();
                    break;
                }
            case 6: {
                    message.owner_soid = $root.CMsgSOIDOwner.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgSOMultipleObjects.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgSOMultipleObjects)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgSOMultipleObjects: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgSOMultipleObjects();
        if (object.objects_modified) {
            if (!Array.isArray(object.objects_modified))
                throw TypeError(".CMsgSOMultipleObjects.objects_modified: array expected");
            message.objects_modified = [];
            for (let i = 0; i < object.objects_modified.length; ++i) {
                if (!$util.isObject(object.objects_modified[i]))
                    throw TypeError(".CMsgSOMultipleObjects.objects_modified: object expected");
                message.objects_modified[i] = $root.CMsgSOMultipleObjects.SingleObject.fromObject(object.objects_modified[i], long + 1);
            }
        }
        if (object.version != null)
            if ($util.Long)
                message.version = $util.Long.fromValue(object.version, true);
            else if (typeof object.version === "string")
                message.version = parseInt(object.version, 10);
            else if (typeof object.version === "number")
                message.version = object.version;
            else if (typeof object.version === "object")
                message.version = new $util.LongBits(object.version.low >>> 0, object.version.high >>> 0).toNumber(true);
        if (object.owner_soid != null) {
            if (!$util.isObject(object.owner_soid))
                throw TypeError(".CMsgSOMultipleObjects.owner_soid: object expected");
            message.owner_soid = $root.CMsgSOIDOwner.fromObject(object.owner_soid, long + 1);
        }
        return message;
    };

    CMsgSOMultipleObjects.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.arrays || options.defaults)
            object.objects_modified = [];
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.version = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.version = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.owner_soid = null;
        }
        if (message.objects_modified && message.objects_modified.length) {
            object.objects_modified = [];
            for (let j = 0; j < message.objects_modified.length; ++j)
                object.objects_modified[j] = $root.CMsgSOMultipleObjects.SingleObject.toObject(message.objects_modified[j], options, q + 1);
        }
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.version = typeof message.version === "number" ? BigInt(message.version) : $util.Long.fromBits(message.version.low >>> 0, message.version.high >>> 0, true).toBigInt();
            else if (typeof message.version === "number")
                object.version = options.longs === String ? String(message.version) : message.version;
            else
                object.version = options.longs === String ? $util.Long.prototype.toString.call(message.version) : options.longs === Number ? new $util.LongBits(message.version.low >>> 0, message.version.high >>> 0).toNumber(true) : message.version;
        if (message.owner_soid != null && Object.hasOwnProperty.call(message, "owner_soid"))
            object.owner_soid = $root.CMsgSOIDOwner.toObject(message.owner_soid, options, q + 1);
        return object;
    };

    CMsgSOMultipleObjects.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgSOMultipleObjects.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgSOMultipleObjects";
    };

    CMsgSOMultipleObjects.SingleObject = (function() {

        function SingleObject(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        SingleObject.prototype.type_id = 0;
        SingleObject.prototype.object_data = $util.newBuffer([]);

        SingleObject.create = function create(properties) {
            return new SingleObject(properties);
        };

        SingleObject.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.type_id != null && Object.hasOwnProperty.call(message, "type_id"))
                writer.uint32(8).int32(message.type_id);
            if (message.object_data != null && Object.hasOwnProperty.call(message, "object_data"))
                writer.uint32(18).bytes(message.object_data);
            return writer;
        };

        SingleObject.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end, message;
            if (length === undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = new $root.CMsgSOMultipleObjects.SingleObject();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.type_id = reader.int32();
                        break;
                    }
                case 2: {
                        message.object_data = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            if (length !== undefined) {
                if (reader.pos !== end)
                    throw RangeError("index out of range");
                reader.len = length;
            }
            return message;
        };

        SingleObject.fromObject = function fromObject(object, long) {
            if (object instanceof $root.CMsgSOMultipleObjects.SingleObject)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".CMsgSOMultipleObjects.SingleObject: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.CMsgSOMultipleObjects.SingleObject();
            if (object.type_id != null)
                message.type_id = object.type_id | 0;
            if (object.object_data != null)
                if (typeof object.object_data === "string")
                    $util.base64.decode(object.object_data, message.object_data = $util.newBuffer($util.base64.length(object.object_data)), 0);
                else if (object.object_data.length >= 0)
                    message.object_data = object.object_data;
            return message;
        };

        SingleObject.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.type_id = 0;
                if (options.bytes === String)
                    object.object_data = "";
                else {
                    object.object_data = [];
                    if (options.bytes !== Array)
                        object.object_data = $util.newBuffer(object.object_data);
                }
            }
            if (message.type_id != null && Object.hasOwnProperty.call(message, "type_id"))
                object.type_id = message.type_id;
            if (message.object_data != null && Object.hasOwnProperty.call(message, "object_data"))
                object.object_data = options.bytes === String ? $util.base64.encode(message.object_data, 0, message.object_data.length) : options.bytes === Array ? Array.prototype.slice.call(message.object_data) : message.object_data;
            return object;
        };

        SingleObject.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        SingleObject.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/CMsgSOMultipleObjects.SingleObject";
        };

        return SingleObject;
    })();

    return CMsgSOMultipleObjects;
})();

export const CSOEconItem = $root.CSOEconItem = (() => {

    function CSOEconItem(properties) {
        this.attribute = [];
        this.equipped_state = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CSOEconItem.prototype.id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CSOEconItem.prototype.account_id = 0;
    CSOEconItem.prototype.inventory = 0;
    CSOEconItem.prototype.def_index = 0;
    CSOEconItem.prototype.quantity = 0;
    CSOEconItem.prototype.level = 0;
    CSOEconItem.prototype.quality = 0;
    CSOEconItem.prototype.flags = 0;
    CSOEconItem.prototype.origin = 0;
    CSOEconItem.prototype.custom_name = "";
    CSOEconItem.prototype.custom_desc = "";
    CSOEconItem.prototype.attribute = $util.emptyArray;
    CSOEconItem.prototype.interior_item = null;
    CSOEconItem.prototype.in_use = false;
    CSOEconItem.prototype.style = 0;
    CSOEconItem.prototype.original_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CSOEconItem.prototype.equipped_state = $util.emptyArray;
    CSOEconItem.prototype.rarity = 0;

    CSOEconItem.create = function create(properties) {
        return new CSOEconItem(properties);
    };

    CSOEconItem.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(8).uint64(message.id);
        if (message.account_id != null && Object.hasOwnProperty.call(message, "account_id"))
            writer.uint32(16).uint32(message.account_id);
        if (message.inventory != null && Object.hasOwnProperty.call(message, "inventory"))
            writer.uint32(24).uint32(message.inventory);
        if (message.def_index != null && Object.hasOwnProperty.call(message, "def_index"))
            writer.uint32(32).uint32(message.def_index);
        if (message.quantity != null && Object.hasOwnProperty.call(message, "quantity"))
            writer.uint32(40).uint32(message.quantity);
        if (message.level != null && Object.hasOwnProperty.call(message, "level"))
            writer.uint32(48).uint32(message.level);
        if (message.quality != null && Object.hasOwnProperty.call(message, "quality"))
            writer.uint32(56).uint32(message.quality);
        if (message.flags != null && Object.hasOwnProperty.call(message, "flags"))
            writer.uint32(64).uint32(message.flags);
        if (message.origin != null && Object.hasOwnProperty.call(message, "origin"))
            writer.uint32(72).uint32(message.origin);
        if (message.custom_name != null && Object.hasOwnProperty.call(message, "custom_name"))
            writer.uint32(82).string(message.custom_name);
        if (message.custom_desc != null && Object.hasOwnProperty.call(message, "custom_desc"))
            writer.uint32(90).string(message.custom_desc);
        if (message.attribute != null && message.attribute.length)
            for (let i = 0; i < message.attribute.length; ++i)
                $root.CSOEconItemAttribute.encode(message.attribute[i], writer.uint32(98).fork(), q + 1).ldelim();
        if (message.interior_item != null && Object.hasOwnProperty.call(message, "interior_item"))
            $root.CSOEconItem.encode(message.interior_item, writer.uint32(106).fork(), q + 1).ldelim();
        if (message.in_use != null && Object.hasOwnProperty.call(message, "in_use"))
            writer.uint32(112).bool(message.in_use);
        if (message.style != null && Object.hasOwnProperty.call(message, "style"))
            writer.uint32(120).uint32(message.style);
        if (message.original_id != null && Object.hasOwnProperty.call(message, "original_id"))
            writer.uint32(128).uint64(message.original_id);
        if (message.equipped_state != null && message.equipped_state.length)
            for (let i = 0; i < message.equipped_state.length; ++i)
                $root.CSOEconItemEquipped.encode(message.equipped_state[i], writer.uint32(146).fork(), q + 1).ldelim();
        if (message.rarity != null && Object.hasOwnProperty.call(message, "rarity"))
            writer.uint32(152).uint32(message.rarity);
        return writer;
    };

    CSOEconItem.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CSOEconItem();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.uint64();
                    break;
                }
            case 2: {
                    message.account_id = reader.uint32();
                    break;
                }
            case 3: {
                    message.inventory = reader.uint32();
                    break;
                }
            case 4: {
                    message.def_index = reader.uint32();
                    break;
                }
            case 5: {
                    message.quantity = reader.uint32();
                    break;
                }
            case 6: {
                    message.level = reader.uint32();
                    break;
                }
            case 7: {
                    message.quality = reader.uint32();
                    break;
                }
            case 8: {
                    message.flags = reader.uint32();
                    break;
                }
            case 9: {
                    message.origin = reader.uint32();
                    break;
                }
            case 10: {
                    message.custom_name = reader.string();
                    break;
                }
            case 11: {
                    message.custom_desc = reader.string();
                    break;
                }
            case 12: {
                    if (!(message.attribute && message.attribute.length))
                        message.attribute = [];
                    message.attribute.push($root.CSOEconItemAttribute.decode(reader, reader.uint32(), undefined, long + 1));
                    break;
                }
            case 13: {
                    message.interior_item = $root.CSOEconItem.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                }
            case 14: {
                    message.in_use = reader.bool();
                    break;
                }
            case 15: {
                    message.style = reader.uint32();
                    break;
                }
            case 16: {
                    message.original_id = reader.uint64();
                    break;
                }
            case 18: {
                    if (!(message.equipped_state && message.equipped_state.length))
                        message.equipped_state = [];
                    message.equipped_state.push($root.CSOEconItemEquipped.decode(reader, reader.uint32(), undefined, long + 1));
                    break;
                }
            case 19: {
                    message.rarity = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CSOEconItem.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CSOEconItem)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CSOEconItem: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CSOEconItem();
        if (object.id != null)
            if ($util.Long)
                message.id = $util.Long.fromValue(object.id, true);
            else if (typeof object.id === "string")
                message.id = parseInt(object.id, 10);
            else if (typeof object.id === "number")
                message.id = object.id;
            else if (typeof object.id === "object")
                message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber(true);
        if (object.account_id != null)
            message.account_id = object.account_id >>> 0;
        if (object.inventory != null)
            message.inventory = object.inventory >>> 0;
        if (object.def_index != null)
            message.def_index = object.def_index >>> 0;
        if (object.quantity != null)
            message.quantity = object.quantity >>> 0;
        if (object.level != null)
            message.level = object.level >>> 0;
        if (object.quality != null)
            message.quality = object.quality >>> 0;
        if (object.flags != null)
            message.flags = object.flags >>> 0;
        if (object.origin != null)
            message.origin = object.origin >>> 0;
        if (object.custom_name != null)
            message.custom_name = String(object.custom_name);
        if (object.custom_desc != null)
            message.custom_desc = String(object.custom_desc);
        if (object.attribute) {
            if (!Array.isArray(object.attribute))
                throw TypeError(".CSOEconItem.attribute: array expected");
            message.attribute = [];
            for (let i = 0; i < object.attribute.length; ++i) {
                if (!$util.isObject(object.attribute[i]))
                    throw TypeError(".CSOEconItem.attribute: object expected");
                message.attribute[i] = $root.CSOEconItemAttribute.fromObject(object.attribute[i], long + 1);
            }
        }
        if (object.interior_item != null) {
            if (!$util.isObject(object.interior_item))
                throw TypeError(".CSOEconItem.interior_item: object expected");
            message.interior_item = $root.CSOEconItem.fromObject(object.interior_item, long + 1);
        }
        if (object.in_use != null)
            message.in_use = Boolean(object.in_use);
        if (object.style != null)
            message.style = object.style >>> 0;
        if (object.original_id != null)
            if ($util.Long)
                message.original_id = $util.Long.fromValue(object.original_id, true);
            else if (typeof object.original_id === "string")
                message.original_id = parseInt(object.original_id, 10);
            else if (typeof object.original_id === "number")
                message.original_id = object.original_id;
            else if (typeof object.original_id === "object")
                message.original_id = new $util.LongBits(object.original_id.low >>> 0, object.original_id.high >>> 0).toNumber(true);
        if (object.equipped_state) {
            if (!Array.isArray(object.equipped_state))
                throw TypeError(".CSOEconItem.equipped_state: array expected");
            message.equipped_state = [];
            for (let i = 0; i < object.equipped_state.length; ++i) {
                if (!$util.isObject(object.equipped_state[i]))
                    throw TypeError(".CSOEconItem.equipped_state: object expected");
                message.equipped_state[i] = $root.CSOEconItemEquipped.fromObject(object.equipped_state[i], long + 1);
            }
        }
        if (object.rarity != null)
            message.rarity = object.rarity >>> 0;
        return message;
    };

    CSOEconItem.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.arrays || options.defaults) {
            object.attribute = [];
            object.equipped_state = [];
        }
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.account_id = 0;
            object.inventory = 0;
            object.def_index = 0;
            object.quantity = 0;
            object.level = 0;
            object.quality = 0;
            object.flags = 0;
            object.origin = 0;
            object.custom_name = "";
            object.custom_desc = "";
            object.interior_item = null;
            object.in_use = false;
            object.style = 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.original_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.original_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            object.rarity = 0;
        }
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.id = typeof message.id === "number" ? BigInt(message.id) : $util.Long.fromBits(message.id.low >>> 0, message.id.high >>> 0, true).toBigInt();
            else if (typeof message.id === "number")
                object.id = options.longs === String ? String(message.id) : message.id;
            else
                object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber(true) : message.id;
        if (message.account_id != null && Object.hasOwnProperty.call(message, "account_id"))
            object.account_id = message.account_id;
        if (message.inventory != null && Object.hasOwnProperty.call(message, "inventory"))
            object.inventory = message.inventory;
        if (message.def_index != null && Object.hasOwnProperty.call(message, "def_index"))
            object.def_index = message.def_index;
        if (message.quantity != null && Object.hasOwnProperty.call(message, "quantity"))
            object.quantity = message.quantity;
        if (message.level != null && Object.hasOwnProperty.call(message, "level"))
            object.level = message.level;
        if (message.quality != null && Object.hasOwnProperty.call(message, "quality"))
            object.quality = message.quality;
        if (message.flags != null && Object.hasOwnProperty.call(message, "flags"))
            object.flags = message.flags;
        if (message.origin != null && Object.hasOwnProperty.call(message, "origin"))
            object.origin = message.origin;
        if (message.custom_name != null && Object.hasOwnProperty.call(message, "custom_name"))
            object.custom_name = message.custom_name;
        if (message.custom_desc != null && Object.hasOwnProperty.call(message, "custom_desc"))
            object.custom_desc = message.custom_desc;
        if (message.attribute && message.attribute.length) {
            object.attribute = [];
            for (let j = 0; j < message.attribute.length; ++j)
                object.attribute[j] = $root.CSOEconItemAttribute.toObject(message.attribute[j], options, q + 1);
        }
        if (message.interior_item != null && Object.hasOwnProperty.call(message, "interior_item"))
            object.interior_item = $root.CSOEconItem.toObject(message.interior_item, options, q + 1);
        if (message.in_use != null && Object.hasOwnProperty.call(message, "in_use"))
            object.in_use = message.in_use;
        if (message.style != null && Object.hasOwnProperty.call(message, "style"))
            object.style = message.style;
        if (message.original_id != null && Object.hasOwnProperty.call(message, "original_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.original_id = typeof message.original_id === "number" ? BigInt(message.original_id) : $util.Long.fromBits(message.original_id.low >>> 0, message.original_id.high >>> 0, true).toBigInt();
            else if (typeof message.original_id === "number")
                object.original_id = options.longs === String ? String(message.original_id) : message.original_id;
            else
                object.original_id = options.longs === String ? $util.Long.prototype.toString.call(message.original_id) : options.longs === Number ? new $util.LongBits(message.original_id.low >>> 0, message.original_id.high >>> 0).toNumber(true) : message.original_id;
        if (message.equipped_state && message.equipped_state.length) {
            object.equipped_state = [];
            for (let j = 0; j < message.equipped_state.length; ++j)
                object.equipped_state[j] = $root.CSOEconItemEquipped.toObject(message.equipped_state[j], options, q + 1);
        }
        if (message.rarity != null && Object.hasOwnProperty.call(message, "rarity"))
            object.rarity = message.rarity;
        return object;
    };

    CSOEconItem.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CSOEconItem.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CSOEconItem";
    };

    return CSOEconItem;
})();

export const CSOEconItemAttribute = $root.CSOEconItemAttribute = (() => {

    function CSOEconItemAttribute(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CSOEconItemAttribute.prototype.def_index = 0;
    CSOEconItemAttribute.prototype.value = 0;
    CSOEconItemAttribute.prototype.value_bytes = $util.newBuffer([]);

    CSOEconItemAttribute.create = function create(properties) {
        return new CSOEconItemAttribute(properties);
    };

    CSOEconItemAttribute.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.def_index != null && Object.hasOwnProperty.call(message, "def_index"))
            writer.uint32(8).uint32(message.def_index);
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            writer.uint32(16).uint32(message.value);
        if (message.value_bytes != null && Object.hasOwnProperty.call(message, "value_bytes"))
            writer.uint32(26).bytes(message.value_bytes);
        return writer;
    };

    CSOEconItemAttribute.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CSOEconItemAttribute();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.def_index = reader.uint32();
                    break;
                }
            case 2: {
                    message.value = reader.uint32();
                    break;
                }
            case 3: {
                    message.value_bytes = reader.bytes();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CSOEconItemAttribute.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CSOEconItemAttribute)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CSOEconItemAttribute: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CSOEconItemAttribute();
        if (object.def_index != null)
            message.def_index = object.def_index >>> 0;
        if (object.value != null)
            message.value = object.value >>> 0;
        if (object.value_bytes != null)
            if (typeof object.value_bytes === "string")
                $util.base64.decode(object.value_bytes, message.value_bytes = $util.newBuffer($util.base64.length(object.value_bytes)), 0);
            else if (object.value_bytes.length >= 0)
                message.value_bytes = object.value_bytes;
        return message;
    };

    CSOEconItemAttribute.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.def_index = 0;
            object.value = 0;
            if (options.bytes === String)
                object.value_bytes = "";
            else {
                object.value_bytes = [];
                if (options.bytes !== Array)
                    object.value_bytes = $util.newBuffer(object.value_bytes);
            }
        }
        if (message.def_index != null && Object.hasOwnProperty.call(message, "def_index"))
            object.def_index = message.def_index;
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
            object.value = message.value;
        if (message.value_bytes != null && Object.hasOwnProperty.call(message, "value_bytes"))
            object.value_bytes = options.bytes === String ? $util.base64.encode(message.value_bytes, 0, message.value_bytes.length) : options.bytes === Array ? Array.prototype.slice.call(message.value_bytes) : message.value_bytes;
        return object;
    };

    CSOEconItemAttribute.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CSOEconItemAttribute.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CSOEconItemAttribute";
    };

    return CSOEconItemAttribute;
})();

export const CSOEconItemEquipped = $root.CSOEconItemEquipped = (() => {

    function CSOEconItemEquipped(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CSOEconItemEquipped.prototype.new_class = 0;
    CSOEconItemEquipped.prototype.new_slot = 0;

    CSOEconItemEquipped.create = function create(properties) {
        return new CSOEconItemEquipped(properties);
    };

    CSOEconItemEquipped.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.new_class != null && Object.hasOwnProperty.call(message, "new_class"))
            writer.uint32(8).uint32(message.new_class);
        if (message.new_slot != null && Object.hasOwnProperty.call(message, "new_slot"))
            writer.uint32(16).uint32(message.new_slot);
        return writer;
    };

    CSOEconItemEquipped.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CSOEconItemEquipped();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.new_class = reader.uint32();
                    break;
                }
            case 2: {
                    message.new_slot = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CSOEconItemEquipped.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CSOEconItemEquipped)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CSOEconItemEquipped: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CSOEconItemEquipped();
        if (object.new_class != null)
            message.new_class = object.new_class >>> 0;
        if (object.new_slot != null)
            message.new_slot = object.new_slot >>> 0;
        return message;
    };

    CSOEconItemEquipped.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            object.new_class = 0;
            object.new_slot = 0;
        }
        if (message.new_class != null && Object.hasOwnProperty.call(message, "new_class"))
            object.new_class = message.new_class;
        if (message.new_slot != null && Object.hasOwnProperty.call(message, "new_slot"))
            object.new_slot = message.new_slot;
        return object;
    };

    CSOEconItemEquipped.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CSOEconItemEquipped.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CSOEconItemEquipped";
    };

    return CSOEconItemEquipped;
})();

export const CMsgCasketItem = $root.CMsgCasketItem = (() => {

    function CMsgCasketItem(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgCasketItem.prototype.casket_item_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;
    CMsgCasketItem.prototype.item_item_id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

    CMsgCasketItem.create = function create(properties) {
        return new CMsgCasketItem(properties);
    };

    CMsgCasketItem.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.casket_item_id != null && Object.hasOwnProperty.call(message, "casket_item_id"))
            writer.uint32(8).uint64(message.casket_item_id);
        if (message.item_item_id != null && Object.hasOwnProperty.call(message, "item_item_id"))
            writer.uint32(16).uint64(message.item_item_id);
        return writer;
    };

    CMsgCasketItem.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgCasketItem();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.casket_item_id = reader.uint64();
                    break;
                }
            case 2: {
                    message.item_item_id = reader.uint64();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgCasketItem.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgCasketItem)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgCasketItem: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgCasketItem();
        if (object.casket_item_id != null)
            if ($util.Long)
                message.casket_item_id = $util.Long.fromValue(object.casket_item_id, true);
            else if (typeof object.casket_item_id === "string")
                message.casket_item_id = parseInt(object.casket_item_id, 10);
            else if (typeof object.casket_item_id === "number")
                message.casket_item_id = object.casket_item_id;
            else if (typeof object.casket_item_id === "object")
                message.casket_item_id = new $util.LongBits(object.casket_item_id.low >>> 0, object.casket_item_id.high >>> 0).toNumber(true);
        if (object.item_item_id != null)
            if ($util.Long)
                message.item_item_id = $util.Long.fromValue(object.item_item_id, true);
            else if (typeof object.item_item_id === "string")
                message.item_item_id = parseInt(object.item_item_id, 10);
            else if (typeof object.item_item_id === "number")
                message.item_item_id = object.item_item_id;
            else if (typeof object.item_item_id === "object")
                message.item_item_id = new $util.LongBits(object.item_item_id.low >>> 0, object.item_item_id.high >>> 0).toNumber(true);
        return message;
    };

    CMsgCasketItem.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.casket_item_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.casket_item_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, true);
                object.item_item_id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
            } else
                object.item_item_id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
        }
        if (message.casket_item_id != null && Object.hasOwnProperty.call(message, "casket_item_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.casket_item_id = typeof message.casket_item_id === "number" ? BigInt(message.casket_item_id) : $util.Long.fromBits(message.casket_item_id.low >>> 0, message.casket_item_id.high >>> 0, true).toBigInt();
            else if (typeof message.casket_item_id === "number")
                object.casket_item_id = options.longs === String ? String(message.casket_item_id) : message.casket_item_id;
            else
                object.casket_item_id = options.longs === String ? $util.Long.prototype.toString.call(message.casket_item_id) : options.longs === Number ? new $util.LongBits(message.casket_item_id.low >>> 0, message.casket_item_id.high >>> 0).toNumber(true) : message.casket_item_id;
        if (message.item_item_id != null && Object.hasOwnProperty.call(message, "item_item_id"))
            if (typeof BigInt !== "undefined" && options.longs === BigInt)
                object.item_item_id = typeof message.item_item_id === "number" ? BigInt(message.item_item_id) : $util.Long.fromBits(message.item_item_id.low >>> 0, message.item_item_id.high >>> 0, true).toBigInt();
            else if (typeof message.item_item_id === "number")
                object.item_item_id = options.longs === String ? String(message.item_item_id) : message.item_item_id;
            else
                object.item_item_id = options.longs === String ? $util.Long.prototype.toString.call(message.item_item_id) : options.longs === Number ? new $util.LongBits(message.item_item_id.low >>> 0, message.item_item_id.high >>> 0).toNumber(true) : message.item_item_id;
        return object;
    };

    CMsgCasketItem.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgCasketItem.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgCasketItem";
    };

    return CMsgCasketItem;
})();

export const CMsgGCItemCustomizationNotification = $root.CMsgGCItemCustomizationNotification = (() => {

    function CMsgGCItemCustomizationNotification(properties) {
        this.item_id = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    }

    CMsgGCItemCustomizationNotification.prototype.item_id = $util.emptyArray;
    CMsgGCItemCustomizationNotification.prototype.request = 0;

    CMsgGCItemCustomizationNotification.create = function create(properties) {
        return new CMsgGCItemCustomizationNotification(properties);
    };

    CMsgGCItemCustomizationNotification.encode = function encode(message, writer, q) {
        if (!writer)
            writer = $Writer.create();
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        if (message.item_id != null && message.item_id.length)
            for (let i = 0; i < message.item_id.length; ++i)
                writer.uint32(8).uint64(message.item_id[i]);
        if (message.request != null && Object.hasOwnProperty.call(message, "request"))
            writer.uint32(16).uint32(message.request);
        return writer;
    };

    CMsgGCItemCustomizationNotification.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (long === undefined)
            long = 0;
        if (long > $Reader.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let end, message;
        if (length === undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = new $root.CMsgGCItemCustomizationNotification();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    if (!(message.item_id && message.item_id.length))
                        message.item_id = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        if (end2 > reader.len)
                            throw RangeError("index out of range");
                        reader.len = end2;
                        while (reader.pos < end2)
                            message.item_id.push(reader.uint64());
                        if (reader.pos !== end2)
                            throw RangeError("index out of range");
                        reader.len = end;
                    } else
                        message.item_id.push(reader.uint64());
                    break;
                }
            case 2: {
                    message.request = reader.uint32();
                    break;
                }
            default:
                reader.skipType(tag & 7, long);
                break;
            }
        }
        if (length !== undefined) {
            if (reader.pos !== end)
                throw RangeError("index out of range");
            reader.len = length;
        }
        return message;
    };

    CMsgGCItemCustomizationNotification.fromObject = function fromObject(object, long) {
        if (object instanceof $root.CMsgGCItemCustomizationNotification)
            return object;
        if (!$util.isObject(object))
            throw TypeError(".CMsgGCItemCustomizationNotification: object expected");
        if (long === undefined)
            long = 0;
        if (long > $util.recursionLimit)
            throw Error("maximum nesting depth exceeded");
        let message = new $root.CMsgGCItemCustomizationNotification();
        if (object.item_id) {
            if (!Array.isArray(object.item_id))
                throw TypeError(".CMsgGCItemCustomizationNotification.item_id: array expected");
            message.item_id = [];
            for (let i = 0; i < object.item_id.length; ++i)
                if ($util.Long)
                    message.item_id[i] = $util.Long.fromValue(object.item_id[i], true);
                else if (typeof object.item_id[i] === "string")
                    message.item_id[i] = parseInt(object.item_id[i], 10);
                else if (typeof object.item_id[i] === "number")
                    message.item_id[i] = object.item_id[i];
                else if (typeof object.item_id[i] === "object")
                    message.item_id[i] = new $util.LongBits(object.item_id[i].low >>> 0, object.item_id[i].high >>> 0).toNumber(true);
        }
        if (object.request != null)
            message.request = object.request >>> 0;
        return message;
    };

    CMsgGCItemCustomizationNotification.toObject = function toObject(message, options, q) {
        if (!options)
            options = {};
        if (q === undefined)
            q = 0;
        if (q > $util.recursionLimit)
            throw Error("max depth exceeded");
        let object = {};
        if (options.arrays || options.defaults)
            object.item_id = [];
        if (options.defaults)
            object.request = 0;
        if (message.item_id && message.item_id.length) {
            object.item_id = [];
            for (let j = 0; j < message.item_id.length; ++j)
                if (typeof BigInt !== "undefined" && options.longs === BigInt)
                    object.item_id[j] = typeof message.item_id[j] === "number" ? BigInt(message.item_id[j]) : $util.Long.fromBits(message.item_id[j].low >>> 0, message.item_id[j].high >>> 0, true).toBigInt();
                else if (typeof message.item_id[j] === "number")
                    object.item_id[j] = options.longs === String ? String(message.item_id[j]) : message.item_id[j];
                else
                    object.item_id[j] = options.longs === String ? $util.Long.prototype.toString.call(message.item_id[j]) : options.longs === Number ? new $util.LongBits(message.item_id[j].low >>> 0, message.item_id[j].high >>> 0).toNumber(true) : message.item_id[j];
        }
        if (message.request != null && Object.hasOwnProperty.call(message, "request"))
            object.request = message.request;
        return object;
    };

    CMsgGCItemCustomizationNotification.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    CMsgGCItemCustomizationNotification.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CMsgGCItemCustomizationNotification";
    };

    return CMsgGCItemCustomizationNotification;
})();

export { $root as default };
